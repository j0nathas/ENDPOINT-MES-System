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
        SELECT [TIPO_MOV],[CODMOV],[MAQUINA],[DATAI],[HORAI],[DATAF],[HORAF],[TURNO],[PARADA_PREVISTA]
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

app.get('/oee/small/:ano/:mes', async (req, res) => {

  const { ano, mes } = req.params;

  try {

    await poolConnect;

    const request = pool.request();

    request.input('ano', sql.VarChar, ano);
    request.input('mes', sql.VarChar, mes);

    const resultado = await request.query(`
        SELECT [MAQUINA],[DATAI],[DATAF],[HORA],[HT],[HD],[HF],[HP],[HPP],[HPNP],[HFP],[HVR],[HOFFLINE],[QTDE_VAR_RITMO],[QTDE_TEORICA_P]
      ,[QTDE_TEORICA_PP],[QTDE_TEORICA_PNP],[QTDE_TEORICA_F],[QTDE_TEORICA],[QTDE_PRD_PARADA],[QTDE_PRODUZIDA],[QTDE_PRD_FABRIC],[QTDE_PRD_PP],
      [QTDE_PRD_PNP],[QTDE_REJEITADA],[QTDE_REJEITADA_PREVISTA],[QTDE_REJEITADA_SEM_DESC],[QTDE_REJEITADA_PP],[QTDE_REJEITADA_PNP],[QTDE_BOAS],[IR],[ID],[IP],[IQ],[IVR]
      ,[OEE],[TURNO],DISP_TEEP],[TEEP]
  FROM [PCPMOV].[dbo].[OEE_HORARIO]
  WHERE MAQUINA BETWEEN 34 AND 53
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