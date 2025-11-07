SET NAMES utf8mb4;

DROP DATABASE IF EXISTS journalismRacer;
CREATE DATABASE journalismRacer;

-- Select the database
-- Give privileges on the created DB to the admin user
GRANT ALL PRIVILEGES ON journalismRacer.* TO 'admin'@'%';
FLUSH PRIVILEGES;

USE journalismRacer;

-- Give privileges on the created DB to the admin user
GRANT ALL PRIVILEGES ON journalismRacer.* TO 'admin'@'%';
FLUSH PRIVILEGES;

-- Create tables
CREATE TABLE articles_easy (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL
);

CREATE TABLE articles_medium (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL
);

CREATE TABLE articles_hard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    img VARCHAR(255) DEFAULT NULL
);

ALTER TABLE users ADD UNIQUE KEY uk_users_username (username);

CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(100) NULL,
    time_ms INT NOT NULL,
    errors INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_results_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_results_user_id ON results(user_id);
CREATE INDEX idx_results_created_at ON results(created_at);


SELECT r.*, u.username as nombre_usuario
FROM results r
LEFT JOIN users u ON r.user_id = u.id
ORDER BY r.created_at DESC;


INSERT INTO articles_easy (id, text) VALUES
(1, "la tecnologia digital ha canviat completament la manera com treballem aprenem i ens comuniquem avui les empreses busquen professionals capaços dadaptarse rapidament als canvis constants"),
(2, "laprenentatge autonom es una de les claus del segle xxi cada persona te al seu abast recursos infinits a internet pero nomes aquells que mantenen la disciplina aconsegueixen progres real"),
(3, "el disseny web no es nomes una questio destetica es una forma de comunicacio visual que ajuda a transmetre un missatge de manera clara i efectiva a lusuari final"),
(4, "la programacio no tracta nomes descriure codi sino de resoldre problemes reals pensar en solucions creatives i construir eines que puguin millorar la vida de les persones"),
(5, "molts desenvolupadors comencen amb projectes petits pero el que realment marca la diferencia es la capacitat de mantenir la constancia fins assolir resultats grans"),
(6, "el mon del desenvolupament web es molt competitiu pero tambe ple dopcions per als qui saben diferenciarse amb idees originals i una bona execucio tecnica"),
(7, "la ciberseguretat sha convertit en una necessitat essencial en un mon on la informacio es el recurs mes valuos protegir les dades es responsabilitat de tothom"),
(8, "els frameworks moderns permeten desenvolupar aplicacions web amb mes rapidesa i ordre pero el coneixement profund dels fonaments del llenguatge continua essent vital"),
(9, "la inteligencia artificial esta transformant tots els sectors des de la medicina fins a leducacio obrint noves oportunitats i reptes etics per a la societat"),
(10, "els estudiants de programacio sovint senten frustracio quan les coses no surten com esperaven pero aquesta mateixa frustracio es el motor del seu creixement personal i professional"),
(11, "en un mon hiperconnectat la capacitat de desconnectar i pensar amb calma es un avantatge els millors desenvolupadors saben quan parar per veure els problemes des duna nova perspectiva"),
(12, "els projectes personals son la millor escola per a un programador es en aquests moments de llibertat creativa on saprèn de veritat a crear sense por de fallar");

-- Articles Medium (with commas and periods, no accents)
INSERT INTO articles_medium (id, text) VALUES
(1, "La tecnologia digital ha canviat completament la manera com treballem, aprenem i ens comuniquem avui. Les empreses busquen professionals capaços d'adaptarse rapidament als canvis constants."),
(2, "L'aprenentatge autonom es una de les claus del segle XXI. Cada persona te al seu abast recursos infinits a internet, pero nomes aquells que mantenen la disciplina aconsegueixen progres real."),
(3, "El disseny web no es nomes una questio d'estetica. Es una forma de comunicacio visual que ajuda a transmetre un missatge de manera clara i efectiva a l'usuari final."),
(4, "La programacio no tracta nomes de descriure codi, sino de resoldre problemes reals, pensar en solucions creatives i construir eines que puguin millorar la vida de les persones."),
(5, "Molts desenvolupadors comencen amb projectes petits, pero el que realment marca la diferencia es la capacitat de mantenir la constancia fins assolir resultats grans."),
(6, "El mon del desenvolupament web es molt competitiu, pero tambe ple dopcions per als qui saben diferenciarse amb idees originals i una bona execucio tecnica."),
(7, "La ciberseguretat s'ha convertit en una necessitat essencial en un mon on la informacio es el recurs mes valuos. Protegir les dades es responsabilitat de tothom."),
(8, "Els frameworks moderns permeten desenvolupar aplicacions web amb mes rapidesa i ordre, pero el coneixement profund dels fonaments del llenguatge continua essent vital."),
(9, "La inteligencia artificial esta transformant tots els sectors, des de la medicina fins a leducacio, obrint noves oportunitats i reptes etics per a la societat."),
(10, "Els estudiants de programacio sovint senten frustracio quan les coses no surten com esperaven, pero aquesta mateixa frustracio es el motor del seu creixement personal i professional."),
(11, "En un mon hiperconnectat, la capacitat de desconnectar i pensar amb calma es un avantatge. Els millors desenvolupadors saben quan parar per veure els problemes des d'una nova perspectiva."),
(12, "Els projectes personals son la millor escola per a un programador. Es en aquests moments de llibertat creativa on sapren de veritat a crear sense por de fallar.");

-- Articles Hard (with commas, periods, and accents)
INSERT INTO articles_hard (id, text) VALUES
(1, "La tecnologia digital ha canviat completament la manera com treballem, aprenem i ens comuniquem avui. Les empreses busquen professionals capaços d'adaptar-se ràpidament als canvis constants."),
(2, "L'aprenentatge autònom és una de les claus del segle XXI. Cada persona té al seu abast recursos infinits a internet, però només aquells que mantenen la disciplina aconsegueixen progrés real."),
(3, "El disseny web no és només una qüestió d'estètica. És una forma de comunicació visual que ajuda a transmetre un missatge de manera clara i efectiva a l'usuari final."),
(4, "La programació no tracta només de descriure codi, sinó de resoldre problemes reals, pensar en solucions creatives i construir eines que puguin millorar la vida de les persones."),
(5, "Molts desenvolupadors comencen amb projectes petits, però el que realment marca la diferència és la capacitat de mantenir la constància fins assolir resultats grans."),
(6, "El món del desenvolupament web és molt competitiu, però també ple d'opcions per als qui saben diferenciar-se amb idees originals i una bona execució tècnica."),
(7, "La ciberseguretat s'ha convertit en una necessitat essencial en un món on la informació és el recurs més valuós. Protegir les dades és responsabilitat de tothom."),
(8, "Els frameworks moderns permeten desenvolupar aplicacions web amb més rapidesa i ordre, però el coneixement profund dels fonaments del llenguatge continua essent vital."),
(9, "La intel·ligència artificial està transformant tots els sectors, des de la medicina fins a l'educació, obrint noves oportunitats i reptes ètics per a la societat."),
(10, "Els estudiants de programació sovint senten frustració quan les coses no surten com esperaven, però aquesta mateixa frustració és el motor del seu creixement personal i professional."),
(11, "En un món hiperconnectat, la capacitat de desconnectar i pensar amb calma és un avantatge. Els millors desenvolupadors saben quan parar per veure els problemes des d'una nova perspectiva."),
(12, "Els projectes personals són la millor escola per a un programador. És en aquests moments de llibertat creativa on s'aprèn de veritat a crear sense por de fallar.");

