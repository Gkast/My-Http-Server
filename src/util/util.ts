export function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => Buffer.isBuffer(chunk) ? chunks.push(chunk) : reject(new Error('Received non-buffer data')));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => chunks.length === 0 ? resolve('') : resolve(Buffer.concat(chunks).toString('utf8')));
    })
}

export function generateTimestamp() {
    return new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
}