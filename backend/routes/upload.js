const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const db = require('../db');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Função para formatar valores monetários
const formatCurrency = (value) => {
  if (value) {
    return parseFloat(value.replace(/[R$\,\s]/g, '').replace('.', '').replace(',', '.')) || 0;
  }
  return 0;
};


const formatDate = (date) => {
  if (!date) return null;


  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/;
  const match = date.match(regex);

  if (match) {
    let [_, day, month, year] = match;


    day = day.padStart(2, '0');
    month = month.padStart(2, '0');

    return `${year}-${month}-${day}`; 
  }

  console.error(`Data de venda inválida: ${date}`);
  return null; 
};

// Mapeamento das colunas do CSV para as colunas do banco de dados
const columnMapping = {
  STONECODE: 'stonecode',
  DATADAVENDA: 'datadavenda',
  BANDEIRA: 'bandeira',
  PRODUTO: 'produto',
  STONEID: 'stoneid',
  QTDDEPARCELAS: 'qtddeparcelas',
  VALORBRUTO: 'valorbruto',
  VALORLIQUIDO: 'valorliquido',
  DESCONTODEMDR: 'descontodemdr',
  DESCONTODEANTECIPACAO: 'descontodeantecipacao',
  NUMEROCARTAO: 'numerocartao',
  MEIODECAPTURA: 'meiodecaptura',
  NUMEROSERIE: 'numeroserie',
  ULTIMOSTATUS: 'ultimostatus',
  DATAULTIMOSTATUS: 'dataultimostatus',
};

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nenhum arquivo enviado.');
  }

  const filePath = path.join(__dirname, '../uploads', req.file.filename);
  const results = [];

  // Processar o arquivo CSV
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      results.push(data);
    })
    .on('end', async () => {
      for (const row of results) {
        try {
         
          const dbValues = [
            row[columnMapping.STONECODE] || null,
            formatDate(row[columnMapping.DATADAVENDA]),
            row[columnMapping.BANDEIRA] || null,
            row[columnMapping.PRODUTO] || null,
            row[columnMapping.STONEID] || null,
            parseInt(row[columnMapping.QTDDEPARCELAS]) || null,
            formatCurrency(row[columnMapping.VALORBRUTO]),
            formatCurrency(row[columnMapping.VALORLIQUIDO]),
            formatCurrency(row[columnMapping.DESCONTODEMDR]),
            formatCurrency(row[columnMapping.DESCONTODEANTECIPACAO]),
            row[columnMapping.NUMEROCARTAO] || null,
            row[columnMapping.MEIODECAPTURA] || null,
            row[columnMapping.NUMEROSERIE] || null,
            row[columnMapping.ULTIMOSTATUS] || null,
            formatDate(row[columnMapping.DATAULTIMOSTATUS]) || null,
          ];

          
          await db.promise().query(
            `INSERT INTO transactions (
              stonecode, datadavenda, bandeira, produto, stoneid, qtddeparcelas, valorbruto, valorliquido,
              descontodemdr, descontodeantecipacao, numerocartao, meiodecaptura, numeroserie, ultimostatus, dataultimostatus
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            dbValues
          );
        } catch (err) {
          console.error('Erro ao inserir dados no banco de dados:', err);
        }
      }

      res.send({ message: 'Arquivo processado e dados inseridos no banco de dados!' });
    })
    .on('error', (err) => {
      console.error('Erro ao processar o arquivo CSV:', err);
      res.status(500).send('Erro ao processar o arquivo.');
    });
});

module.exports = router;
