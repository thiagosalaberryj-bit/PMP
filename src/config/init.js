import pool from './database.js';

const createTables = `
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    preference_id VARCHAR(255),
    mp_payment_id VARCHAR(255),
    transaction_amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    status ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
    payer_email VARCHAR(255),
    init_point TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

export default async function initDB() {
  const statements = createTables.split(';').filter(s => s.trim());
  for (const sql of statements) {
    await pool.query(sql);
  }

  const alterStatements = [
    "ALTER TABLE users ADD COLUMN mp_user_id VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN mp_access_token TEXT",
    "ALTER TABLE users ADD COLUMN mp_refresh_token TEXT",
    "ALTER TABLE users ADD COLUMN mp_token_expires_at DATETIME",
  ];

  for (const sql of alterStatements) {
    try { await pool.query(sql); } catch {}
  }

  console.log('Tablas verificadas/creadas correctamente');
}
