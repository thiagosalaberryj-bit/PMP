CREATE DATABASE IF NOT EXISTS pmp;
USE pmp;

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
