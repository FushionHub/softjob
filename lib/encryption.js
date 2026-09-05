import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey() {
    const key = process.env.WALLET_ENCRYPTION_KEY || process.env.JWT_SECRET;
    if (!key) {
        throw new Error('WALLET_ENCRYPTION_KEY environment variable is required.');
    }
    if (/^[0-9a-fA-F]{64}$/.test(key)) {
        return Buffer.from(key, 'hex');
    }
    return crypto.createHash('sha256').update(key).digest();
}

export function encrypt(text) {
    if (!text) return null;
    
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine iv + tag + encrypted data
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedText) {
    if (!encryptedText) return null;
    
    try {
        const key = getEncryptionKey();
        const parts = encryptedText.split(':');
        
        if (parts.length !== 3) {
            // Not encrypted data, return as-is (backward compatibility)
            return encryptedText;
        }
        
        const iv = Buffer.from(parts[0], 'hex');
        const tag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error.message);
        // Return original text if decryption fails (backward compatibility)
        return encryptedText;
    }
}

export function encryptObject(obj, fields) {
    if (!obj) return obj;
    
    const encrypted = { ...obj };
    for (const field of fields) {
        if (encrypted[field]) {
            encrypted[field] = encrypt(encrypted[field]);
        }
    }
    return encrypted;
}

export function decryptObject(obj, fields) {
    if (!obj) return obj;
    
    const decrypted = { ...obj };
    for (const field of fields) {
        if (decrypted[field]) {
            decrypted[field] = decrypt(decrypted[field]);
        }
    }
    return decrypted;
}
