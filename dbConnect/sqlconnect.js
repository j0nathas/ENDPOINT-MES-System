const express = require('express');
const sql = require('mssql');
require('dotenv').config();

const app = express();
app.use(express.json());

const config = {
  user: process.env.USERDB,
  password: process.env.PASSDB,
  server: process.env.SRVDB,
  database: process.env.DBNAME,
  options: {
    instanceName: process.env.INSTANCENAME,
    encrypt: false,
    trustServerCertificate: true
  }
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

app.get('/maquinas', async (req, res) => {

  try {

    await poolConnect;

    const resultado = await pool.request().query(`
        SELECT [MAQUINA],[NOME_DA_MAQUINA] FROM dbo.MAQUINAS
    `);

    res.json(resultado.recordset);

  } catch (erro) {

    console.error(erro);

    res.status(500).json({
      erro: "Erro ao consultar banco"
    });

  }

});

app.get('/paradas', async (req, res) => {

  try {

    await poolConnect;

    const resultado = await pool.request().query(`
        SELECT *
        FROM dbo.PARADAS
    `);

    res.json(resultado.recordset);

  } catch (erro) {

    console.error(erro);

    res.status(500).json({
      erro: "Erro ao consultar banco"
    });

  }

});

app.get('/movimentacao/:maquina/:ano/:mes', async (req, res) => {

  const { ano, mes, maquina, movimentacao } = req.params;

  try {

    await poolConnect;

    const request = pool.request();

    request.input('ano', sql.VarChar, ano);
    request.input('mes', sql.VarChar, mes);
    request.input('maquina', sql.VarChar, maquina);

    const resultado = await request.query(`
        SELECT [TIPO_MOV],[CODMOV],[MAQUINA],[DATAI],[HORAI],[DATAF],[HORAF],[TURNO],[PARADA_PREVISTA]
        FROM dbo.MOVIMENTACAO
        WHERE TIPO_MOV in ('F', 'P')
        AND MAQUINA = @maquina
        AND YEAR(DATAI) = @ano
        AND MONTH(DATAI) = @mes
        ORDER BY DATAI DESC
    `);

    res.json(resultado.recordset);

  } catch (erro) {

    console.error(erro);

    res.status(500).json({
      erro: "Erro ao consultar banco"
    });

  }

});

app.get('/movimentacaosmall/:ano/:mes', async (req, res) => {
  const { ano, mes } = req.params;

  if (!ano || !mes || mes < 1 || mes > 12) {
    return res.status(400).json({ erro: 'Ano ou mês inválido' });
  }

  try {
    await poolConnect;

    const request = pool.request();

    request.input('ano', sql.Int, parseInt(ano));
    request.input('mes', sql.Int, parseInt(mes));

    const resultado = await request.query(`
        SELECT *
        FROM dbo.MOVIMENTACAO
        WHERE TIPO_MOV IN ('P')
          AND MAQUINA BETWEEN 34 AND 53 
          AND DATAI >= DATEFROMPARTS(@ano, @mes, 1)
          AND DATAI < DATEADD(MONTH, 1, DATEFROMPARTS(@ano, @mes, 1))
        ORDER BY DATAI DESC
    `);

    res.json(resultado.recordset);

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao consultar banco" });
  }
});

app.get('/movimentacaoinjecao/:ano/:mes', async (req, res) => {
  const { ano, mes } = req.params;

  if (!ano || !mes || mes < 1 || mes > 12) {
    return res.status(400).json({ erro: 'Ano ou mês inválido' });
  }

  try {
    await poolConnect;

    const request = pool.request();

    request.input('ano', sql.Int, parseInt(ano));
    request.input('mes', sql.Int, parseInt(mes));

    const resultado = await request.query(`
        SELECT [TIPO_MOV],[CODMOV],[MAQUINA],[DATAI],[HORAI],[DATAF],[HORAF],[TURNO],[PARADA_PREVISTA]
        FROM dbo.MOVIMENTACAO
        WHERE TIPO_MOV IN ('P')
          AND (
            MAQUINA BETWEEN 1 AND 33
            OR MAQUINA = 115
          )
          AND DATAI >= DATEFROMPARTS(@ano, @mes, 1)
          AND DATAI < DATEADD(MONTH, 1, DATEFROMPARTS(@ano, @mes, 1))
        ORDER BY DATAI DESC
    `);

    res.json(resultado.recordset);

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao consultar banco" });
  }
});

app.get('/movimentacaoGeral/:maquina/:tipo_mov/:datai', async (req, res) => {
  const { maquina, tipo_mov, datai } = req.params;

  if (!maquina || !tipo_mov || !datai) {
    return res.status(400).json({ erro: 'Parâmetros inválidos' });
  }

  try {
    await poolConnect;

    const request = pool.request();

    request.input('maquina', sql.Int, parseInt(maquina));
    request.input('tipo_mov', sql.VarChar, tipo_mov);
    request.input('datai', sql.Date, Date(new Date(datai)));

    const resultado = await request.query(`
        SELECT *FROM dbo.MOVIMENTACAO
        WHERE TIPO_MOV IN (@tipo_mov)
          AND MAQUINA = @maquina
          AND DATAI = @datai
        ORDER BY DATAI DESC, HORAI DESC
    `);

    res.json(resultado.recordset);

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao consultar banco" });
  }
});

app.get('/oee/small/:ano/:mes/:dia', async (req, res) => {

  const { ano, mes, dia } = req.params;

  try {

    await poolConnect;

    const request = pool.request();

    request.input('ano', sql.Int, parseInt(ano));
    request.input('mes', sql.Int, parseInt(mes));
    request.input('dia', sql.Int, parseInt(dia));

    const resultado = await request.query(`
        SELECT * FROM [PCPMOV].[dbo].[OEE_HORARIO]
  WHERE MAQUINA BETWEEN 34 AND 53
  AND YEAR(DATAI) = @ano
        AND MONTH(DATAI) = @mes
        AND DAY(DATAI) = @dia
        ORDER BY DATAI DESC
    `);

    res.json(resultado.recordset);

  } catch (erro) {

    console.error(erro);

    res.status(500).json({
      erro: "Erro ao consultar banco"
    });

  }

});

app.get('/itens_os/:inicio/:fim', async (req, res) => {

  const { inicio, fim } = req.params;

  try {

    await poolConnect;

    const request = pool.request();

    request.input('inicio', sql.Date, Date(new Date(inicio)));
    request.input('fim', sql.Date, Date(new Date(fim)));

    const resultado = await request.query(`
             SELECT * FROM [PCPMOV].[dbo].[ITENSOS]
              WHERE DATA_MODIFICACAO >= @inicio
                    AND DATA_MODIFICACAO <= @fim
                    ORDER BY DATA_MODIFICACAO DESC, HORA_MODIFICACAO DESC
    `);
    res.json(resultado.recordset);

  } catch (erro) {

    console.error(erro);

    res.status(500).json({
      erro: "Erro ao consultar banco"
    });

  }

});


app.get('/pecas', async (req, res) => {


  try {

    await poolConnect;

    const request = pool.request();

    const resultado = await request.query(`
        SELECT *
        FROM dbo.PECAS
    `);

    res.json(resultado.recordset);

  } catch (erro) {

    console.error(erro);

    res.status(500).json({
      erro: "Erro ao consultar banco"
    });

  }

});

const os = require('os');

const ip = Object.values(os.networkInterfaces())
  .flat()
  .find(i => i.family === 'IPv4' && !i.internal)?.address ?? 'localhost';

app.listen(3000, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://${ip}:3000`);
});