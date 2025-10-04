const net = require('net');

/**
 * 指定されたポートが利用可能かチェックする
 * @param {number} port チェックするポート番号
 * @returns {Promise<boolean>} ポートが利用可能な場合はtrue
 */
function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * ポートが使用中の場合にエラーメッセージを表示して終了
 * @param {number} port チェックするポート番号
 * @param {string} serviceName サービス名
 */
async function ensurePortAvailable(port, serviceName) {
  const isAvailable = await checkPortAvailable(port);
  
  if (!isAvailable) {
    console.error(`❌ Port ${port} is already in use!`);
    console.error(`📍 Please stop the service using port ${port} before starting ${serviceName}`);
    console.error(`💡 You can check what's using the port with: lsof -i :${port}`);
    console.error(`💡 Or kill the process with: kill -9 $(lsof -t -i:${port})`);
    process.exit(1);
  }
  
  console.log(`✅ Port ${port} is available for ${serviceName}`);
}

// スクリプトが直接実行された場合
if (require.main === module) {
  const port = parseInt(process.argv[2]) || 3000;
  const serviceName = process.argv[3] || 'Frontend';
  
  ensurePortAvailable(port, serviceName).catch((error) => {
    console.error('❌ Port check failed:', error.message);
    process.exit(1);
  });
}

module.exports = { checkPortAvailable, ensurePortAvailable };