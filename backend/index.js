const express = require('express');
const cors = require('cors');
const db = require('./db');
const uploadRoute = require('./routes/upload'); 
const reportsRoute = require('./routes/reports');
require('dotenv').config();

const app = express();
const loginRoute = require('./routes/login');


app.use(cors());
app.use(express.json());
app.use('/api', uploadRoute); 
app.use('/api', reportsRoute);
app.use('/api', loginRoute);


app.get('/', (req, res) => {
    res.send('SimpliSaldo API funcionando!');
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
