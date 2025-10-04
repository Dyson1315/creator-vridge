import { createServer } from 'net';

/**
 * 指定されたポートが利用可能かチェックする
 * @param port チェックするポート番号
 * @returns Promise<boolean> ポートが利用可能な場合はtrue
 */
export function checkPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    
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
 * @param port チェックするポート番号
 * @param serviceName サービス名
 */
export async function ensurePortAvailable(port: number, serviceName: string): Promise<void> {
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