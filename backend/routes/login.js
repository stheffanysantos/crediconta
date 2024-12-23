const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

const secret = process.env.JWT_SECRET; 

router.post('/login', async (req, res) => {
  const { username, password } = req.body; 

  try {
  
    const [rows] = await db.promise().query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, username]
    );

    if (rows.length === 0) {
      return res.status(401).send('Usuário não encontrado.');
    }

    const user = rows[0];

 
    if (password !== user.password) {
      return res.status(401).send('Senha inválida.');
    }

   
    const token = jwt.sign({ id: user.id, username: user.username }, secret, { expiresIn: '1h' });
    res.send({ token }); 
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).send('Erro interno do servidor.');
  }
});

module.exports = router;
