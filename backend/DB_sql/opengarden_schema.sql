-- ============================================
-- OpenGarden – MySQL Database Schema
-- ============================================

-- Uživatelé systému
CREATE TABLE users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)        NOT NULL,
    email       VARCHAR(150)        NOT NULL UNIQUE,
    password    VARCHAR(255)        NOT NULL,
    role        ENUM('member', 'admin') NOT NULL DEFAULT 'member',
    created_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Záhony (garden beds)
CREATE TABLE garden_beds (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    label       VARCHAR(50)         NOT NULL,   -- např. "A1", "B3"
    description TEXT,
    status      ENUM('available', 'reserved', 'inactive') NOT NULL DEFAULT 'available',
    user_id     INT                 NULL,       -- kdo má záhon rezervovaný
    reserved_at DATETIME            NULL,
    CONSTRAINT fk_bed_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Úkoly (tasks)
CREATE TABLE tasks (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200)        NOT NULL,
    description TEXT,
    status      ENUM('open', 'in_progress', 'done') NOT NULL DEFAULT 'open',
    created_by  INT                 NOT NULL,
    assigned_to INT                 NULL,
    created_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date    DATE                NULL,
    CONSTRAINT fk_task_creator  FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_assignee FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Vybavení (equipment)
CREATE TABLE equipment (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)        NOT NULL,
    description TEXT,
    status      ENUM('ok', 'damaged', 'under_repair', 'retired') NOT NULL DEFAULT 'ok',
    created_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Hlášení problémů (garden reports)
-- Automaticky generuje task při vytvoření (lze řešit triggerem nebo aplikačně)
CREATE TABLE reports (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200)    NOT NULL,
    description     TEXT            NOT NULL,
    reported_by     INT             NOT NULL,
    equipment_id    INT             NULL,       -- pokud jde o problém s vybavením
    task_id         INT             NULL,       -- vygenerovaný task z tohoto reportu
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_user      FOREIGN KEY (reported_by)  REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
    CONSTRAINT fk_report_task      FOREIGN KEY (task_id)      REFERENCES tasks(id)     ON DELETE SET NULL
);

-- Komunitní akce (community events)
CREATE TABLE community_events (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200)        NOT NULL,
    description TEXT,
    event_date  DATETIME            NOT NULL,
    created_by  INT                 NOT NULL,
    created_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Účast na akcích (participation)
CREATE TABLE event_participations (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    event_id    INT                 NOT NULL,
    user_id     INT                 NOT NULL,
    status      ENUM('going', 'not_going', 'maybe') NOT NULL DEFAULT 'maybe',
    updated_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_part_event FOREIGN KEY (event_id) REFERENCES community_events(id) ON DELETE CASCADE,
    CONSTRAINT fk_part_user  FOREIGN KEY (user_id)  REFERENCES users(id)            ON DELETE CASCADE,
    UNIQUE KEY uq_event_user (event_id, user_id)
);
