-- Service Requests (For Maintenance/Cleaning)
CREATE TABLE service_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NULL,
  
  type VARCHAR(50) NULL, -- MAINTENANCE, CLEANING
  description VARCHAR(500) NULL,
  
  items_image VARCHAR(500) NULL,
  
  priority VARCHAR(20) NULL, -- LIGHT, MEDIUM, HIGH, URGENT
  status VARCHAR(20) NULL, -- PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  
  resolution_notes VARCHAR(1000) NULL,
  
  reported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_sr_room 
    FOREIGN KEY (room_id) REFERENCES room(room_id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO service_requests (room_id, type, description, priority, status, reported_at) VALUES 
(1, 'MAINTENANCE', 'Air conditioner leaking water', 'HIGH', 'PENDING', NOW()),
(2, 'CLEANING', 'Room needs deep cleaning', 'MEDIUM', 'IN_PROGRESS', NOW());
