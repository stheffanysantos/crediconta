const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const db = require('../db');
const { parse, isValid, format } = require('date-fns');
const { pt } = require('date-fns/locale');
const { Readable } = require('stream');

const router = express.Router();

// Configuração do multer para armazenar arquivos em memória
const storage = multer.memoryStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Função para formatar o valor monetário
const formatCurrency = (value) =>
  value ? parseFloat(value.replace('R$', '').replace('.', '').replace(',', '.')) || 0 : 0;

// Função para formatar datas
const formatDate = (date) => {
  if (!date || date.trim() === '') {
    console.warn('⚠️ Data inválida detectada:', date);
    return null;
  }

  const trimmedDate = date.trim();
  const parsedDate = parse(trimmedDate, 'dd/MM/yyyy HH:mm:ss', new Date(), { locale: pt });

  if (!isValid(parsedDate)) {
    console.error('❌ Erro ao converter data:', date);
    return null;
  }

  return format(parsedDate, 'yyyy-MM-dd HH:mm:ss'); // Formato esperado pelo banco
};

// Rota para o upload do CSV
router.post('/upload', upload.single('arquivo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nenhum arquivo enviado.');
  }

  // Registra o nome do arquivo CSV na tabela 'imported_files' (apenas uma vez)
  try {
    await db.promise().query(
      `INSERT INTO imported_files (filename, upload_date) VALUES (?, ?)`,
      [req.file.originalname, new Date()]
    );
    console.log(`✅ Arquivo registrado na tabela imported_files: ${req.file.originalname}`);
  } catch (err) {
    console.error('❌ Erro ao registrar arquivo na tabela de arquivos importados:', err);
  }

  const results = [];
  let lineCount = 0;
  let columnMapping = {};

  // Converte o buffer para um Readable stream
  const fileStream = Readable.from(req.file.buffer.toString('utf8'));

  // Processa o CSV do stream
  fileStream
    .pipe(csv({ separator: ';', headers: false }))
    .on('data', (data) => {
      lineCount++;

      // Mapeia as colunas na segunda linha
      if (lineCount === 2) {
        columnMapping = {
          0: 'stonecode',
          1: 'datadavenda',
          2: 'bandeira',
          3: 'produto',
          4: 'stoneid',
          5: 'qtddeparcelas',
          6: 'valorbruto',
          7: 'valorliquido',
          8: 'descontodemdr',
          9: 'descontodeantecipacao',
          10: 'numerocartao',
          11: 'meiodecaptura',
          12: 'numeroserie',
          13: 'ultimostatus',
          14: 'dataultimostatus',
        };
        return;
      }

      // Pula a primeira e segunda linha
      if (lineCount === 1 || lineCount === 2) return;

      results.push({
        stonecode: data[0] || null,
        datadavenda: formatDate(data[1]),
        bandeira: data[2] || null,
        produto: data[3] || null,
        stoneid: data[4] || null,
        qtddeparcelas: parseInt(data[5]) || null,
        valorbruto: formatCurrency(data[6]),
        valorliquido: formatCurrency(data[7]),
        descontodemdr: formatCurrency(data[8]),
        descontodeantecipacao: formatCurrency(data[9]),
        numerocartao: data[10] || null,
        meiodecaptura: data[11] || null,
        numeroserie: data[12] || null,
        ultimostatus: data[13] || null,
        dataultimostatus: formatDate(data[14]),
      });
    })
    .on('end', async () => {
      let insertedCount = 0;
      let skippedCount = 0;

      // Processa os resultados e insere no banco de dados
      for (const row of results) {
        try {
          // Verifica se já existe um registro com os mesmos valores de stoneid
          const [existingRows] = await db.promise().query(
            `SELECT id FROM transactions WHERE stoneid = ?`,
            [row.stoneid]
          );

          if (existingRows.length > 0) {
            // Se já existe, não insere
            skippedCount++;
            console.log(`⚠️ Venda duplicada ignorada: ${JSON.stringify(row)}`);
          } else {
            // Insere a nova venda na tabela 'transactions'
            await db.promise().query(
              `INSERT INTO transactions (stonecode, datadavenda, bandeira, produto, stoneid, qtddeparcelas, valorbruto, valorliquido, descontodemdr, descontodeantecipacao, numerocartao, meiodecaptura, numeroserie, ultimostatus, dataultimostatus) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              Object.values(row) // Usando os valores do objeto 'row'
            );
            insertedCount++;
            console.log(`✅ Nova venda inserida: ${JSON.stringify(row)}`);

            // Implementando a lógica da trigger aqui no backend

            // Obtendo o idzeus do cliente com base na maquininha utilizada na transação
            const [clientResult] = await db.promise().query(
              `SELECT idzeus FROM movements WHERE NumeroSerie = ? OR NumeroSerie2 = ? LIMIT 1`,
              [row.numeroserie, row.numeroserie]
            );
            const IdZeusCliente = clientResult[0]?.idzeus;

            if (IdZeusCliente) {
              // Calculando o total sem porcentagem (soma de todas as transações por maquininha)
              const [totalSemPorcentagemResult] = await db.promise().query(
                `SELECT COALESCE(SUM(valorbruto), 0) AS Total_Sem_Porcentagem FROM transactions 
                 WHERE NumeroSerie IN (
                   SELECT NumeroSerie FROM movements WHERE idzeus = ? 
                   UNION 
                   SELECT NumeroSerie2 FROM movements WHERE idzeus = ?
                 )`,
                [IdZeusCliente, IdZeusCliente]
              );
              const Total_Sem_Porcentagem = totalSemPorcentagemResult[0]?.Total_Sem_Porcentagem || 0;

              // Calculando o total com a porcentagem aplicada
              const [totalComPorcentagemResult] = await db.promise().query(
                `SELECT COALESCE(SUM(t.valorbruto - (t.valorbruto * h.percentage)), 0) AS Total_Com_Porcentagem 
                 FROM transactions t
                 INNER JOIN historicocredito h ON 
                   (t.produto LIKE 'Crédito%' AND h.tipo = 'Credito') OR 
                   (t.produto LIKE 'Débito%' AND h.tipo = 'Debito') OR 
                   (t.produto = 'Voucher' AND h.tipo = 'Alimentacao')
                 WHERE t.NumeroSerie IN (
                   SELECT NumeroSerie FROM movements WHERE idzeus = ? 
                   UNION 
                   SELECT NumeroSerie2 FROM movements WHERE idzeus = ?
                 )`,
                [IdZeusCliente, IdZeusCliente]
              );
              const Total_Com_Porcentagem = totalComPorcentagemResult[0]?.Total_Com_Porcentagem || 0;

              // Calculando a diferença entre os valores
              const Diferenca_Total = Total_Sem_Porcentagem - Total_Com_Porcentagem;

              // Inserindo os valores calculados na tabela `totcredito`
              await db.promise().query(
                `INSERT INTO totcredito (NumeroSerie, Total_Sem_Porcentagem, Total_Com_Porcentagem, Diferenca_Total) 
                 VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                   Total_Sem_Porcentagem = VALUES(Total_Sem_Porcentagem), 
                   Total_Com_Porcentagem = VALUES(Total_Com_Porcentagem), 
                   Diferenca_Total = VALUES(Diferenca_Total)`,
                [row.numeroserie, Total_Sem_Porcentagem, Total_Com_Porcentagem, Diferenca_Total]
              );

              // Atualizando os valores na tabela `movements`
              await db.promise().query(
                `UPDATE movements
                 SET Total = ?, TotalPorcentage = ?
                 WHERE idzeus = ?`,
                [Total_Sem_Porcentagem, Total_Com_Porcentagem, IdZeusCliente]
              );
            }
          }
        } catch (err) {
          console.error('❌ Erro ao inserir no banco:', err.sqlMessage || err);
        }
      }
      res.send({
        message: `CSV processado! Novos registros: ${insertedCount}, Duplicados ignorados: ${skippedCount}`,
      });
    })
    .on('error', (err) => {
      console.error('❌ Erro no processamento do CSV:', err);
      res.status(500).send('Erro ao processar o arquivo.');
    });
});

router.get('/imports', async (req, res) => {
  try {
    const [importedFiles] = await db.promise().query(
      `SELECT filename, upload_date FROM imported_files ORDER BY upload_date DESC LIMIT 5`
    );
    
    res.send({
      message: `Arquivos importados:`,
      arquivosImportados: importedFiles,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar arquivos importados:', error);
    res.status(500).send('Erro ao buscar arquivos importados.');
  }
});

module.exports = router;
