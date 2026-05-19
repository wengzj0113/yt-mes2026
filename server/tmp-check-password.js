const sql = require('mssql');
const bcrypt = require('bcrypt');
(async () => {
  const config = {
    server: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    user: process.env.DB_USERNAME || 'sa',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'YT_MES',
    options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true },
  };
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT TOP 1 password FROM sys_user WHERE username = 'admin'");
    if (!result.recordset.length) {
      console.log('NO_ADMIN');
      return;
    }
    const ok = await bcrypt.compare('admin123', result.recordset[0].password);
    console.log(JSON.stringify({ passwordMatchesAdmin123: ok }));
    await pool.close();
  } catch (err) {
    console.error('BCRYPT_CHECK_ERROR');
    console.error(err.message);
    process.exit(1);
  }
})();
