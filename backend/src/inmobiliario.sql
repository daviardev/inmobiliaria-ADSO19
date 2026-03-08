-- MySQL dump 10.13  Distrib 8.0.45, for macos15 (arm64)
--
-- Host: 127.0.0.1    Database: inmobiliario
-- ------------------------------------------------------
-- Server version	8.4.8

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `compra`
--

DROP TABLE IF EXISTS `compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compra` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha_compra` date NOT NULL,
  `valor_total` decimal(12,2) NOT NULL,
  `saldo_pendiente` decimal(12,2) NOT NULL,
  `usuario_id` int NOT NULL,
  `lote_id` int NOT NULL,
  `estado` enum('pendiente','pagado') DEFAULT 'pendiente',
  `porcentaje_enganche` decimal(5,2) DEFAULT '0.00' COMMENT '10, 20, 30',
  `valor_enganche` decimal(12,2) DEFAULT '0.00',
  `saldo_financiado` decimal(12,2) DEFAULT '0.00',
  `numero_cuotas` int DEFAULT '1' COMMENT '1, 12, 24, 36, 60',
  `valor_cuota` decimal(12,2) DEFAULT '0.00',
  `tasa_interes` decimal(5,4) DEFAULT '0.0100' COMMENT '1% mensual',
  `fecha_inicio_plan` date DEFAULT NULL,
  `cuotas_pagadas` int DEFAULT '0',
  `cuotas_vencidas` int DEFAULT '0',
  `plano_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `lote_id` (`lote_id`),
  KEY `fk_compra_plano` (`plano_id`),
  CONSTRAINT `compra_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `compra_ibfk_2` FOREIGN KEY (`lote_id`) REFERENCES `lotes` (`id`),
  CONSTRAINT `fk_compra_plano` FOREIGN KEY (`plano_id`) REFERENCES `lote_planos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compra`
--

LOCK TABLES `compra` WRITE;
/*!40000 ALTER TABLE `compra` DISABLE KEYS */;
INSERT INTO `compra` VALUES (1,'2026-03-01',180000000.00,0.00,1,1,'pagado',0.00,0.00,0.00,1,0.00,0.0100,NULL,0,0,NULL),(2,'2026-03-07',180000000.00,131000000.00,1,2,'pendiente',20.00,36000000.00,144000000.00,12,12794226.00,0.0100,'2026-03-07',1,0,NULL),(3,'2026-03-07',220000000.00,86000000.00,1,3,'pendiente',20.00,44000000.00,176000000.00,12,15637387.00,0.0100,'2026-03-07',1,0,15);
/*!40000 ALTER TABLE `compra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuotas`
--

DROP TABLE IF EXISTS `cuotas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuotas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `compra_id` int NOT NULL,
  `numero_cuota` int NOT NULL COMMENT '1, 2, 3...',
  `valor_cuota` decimal(12,2) NOT NULL COMMENT 'Monto fijo mensual',
  `monto_capital` decimal(12,2) DEFAULT '0.00' COMMENT 'Porción de capital',
  `monto_interes` decimal(12,2) DEFAULT '0.00' COMMENT 'Porción de interés',
  `saldo_restante` decimal(12,2) DEFAULT '0.00' COMMENT 'Saldo después de esta cuota',
  `fecha_vencimiento` date NOT NULL,
  `estado` enum('pendiente','pagado','vencido') DEFAULT 'pendiente',
  `fecha_pago` date DEFAULT NULL,
  `monto_pagado` decimal(12,2) DEFAULT '0.00' COMMENT 'Monto real pagado',
  `dias_mora` int DEFAULT '0',
  `interes_moratorio` decimal(12,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_cuota_compra` (`compra_id`,`numero_cuota`),
  KEY `idx_estado` (`estado`),
  KEY `idx_vencimiento` (`fecha_vencimiento`),
  CONSTRAINT `cuotas_ibfk_1` FOREIGN KEY (`compra_id`) REFERENCES `compra` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuotas`
--

LOCK TABLES `cuotas` WRITE;
/*!40000 ALTER TABLE `cuotas` DISABLE KEYS */;
INSERT INTO `cuotas` VALUES (1,2,1,12794226.00,11354226.00,1440000.00,132645774.00,'2026-04-07','pagado','2026-03-07',13000000.00,0,0.00,'2026-03-07 20:34:24'),(2,2,2,12794226.00,11467768.00,1326458.00,121178006.00,'2026-05-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 20:34:24'),(3,2,3,12794226.00,11582446.00,1211780.00,109595560.00,'2026-06-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 20:34:24'),(4,2,4,12794226.00,11698270.00,1095956.00,97897290.00,'2026-07-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 20:34:24'),(5,2,5,12794226.00,11815253.00,978973.00,86082037.00,'2026-08-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 20:34:24'),(6,2,6,12794226.00,11933406.00,860820.00,74148631.00,'2026-09-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 20:34:24'),(7,2,7,12794226.00,12052740.00,741486.00,62095891.00,'2026-10-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 20:34:24'),(8,2,8,12794226.00,12173267.00,620959.00,49922624.00,'2026-11-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 20:34:24'),(9,2,9,12794226.00,12295000.00,499226.00,37627624.00,'2026-12-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 20:34:24'),(10,2,10,12794226.00,12417950.00,376276.00,25209674.00,'2027-01-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 20:34:24'),(11,2,11,12794226.00,12542129.00,252097.00,12667545.00,'2027-02-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 20:34:24'),(12,2,12,12794226.00,12667551.00,126675.00,0.00,'2027-03-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 20:34:24'),(13,3,1,15637387.00,13877387.00,1760000.00,162122613.00,'2026-04-07','pagado','2026-03-07',90000000.00,0,0.00,'2026-03-07 22:43:32'),(14,3,2,15637387.00,14016161.00,1621226.00,148106452.00,'2026-05-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 22:43:32'),(15,3,3,15637387.00,14156322.00,1481065.00,133950130.00,'2026-06-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 22:43:32'),(16,3,4,15637387.00,14297886.00,1339501.00,119652244.00,'2026-07-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 22:43:32'),(17,3,5,15637387.00,14440865.00,1196522.00,105211379.00,'2026-08-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 22:43:32'),(18,3,6,15637387.00,14585273.00,1052114.00,90626106.00,'2026-09-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 22:43:32'),(19,3,7,15637387.00,14731126.00,906261.00,75894980.00,'2026-10-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 22:43:32'),(20,3,8,15637387.00,14878437.00,758950.00,61016543.00,'2026-11-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 22:43:32'),(21,3,9,15637387.00,15027222.00,610165.00,45989321.00,'2026-12-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 22:43:32'),(22,3,10,15637387.00,15177494.00,459893.00,30811827.00,'2027-01-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 22:43:32'),(23,3,11,15637387.00,15329269.00,308118.00,15482558.00,'2027-02-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 22:43:32'),(24,3,12,15637387.00,15482561.00,154826.00,0.00,'2027-03-07','pendiente',NULL,0.00,0,0.00,'2026-03-07 22:43:32');
/*!40000 ALTER TABLE `cuotas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `etapas`
--

DROP TABLE IF EXISTS `etapas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `etapas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_etapa` varchar(255) NOT NULL,
  `descripcion` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `etapas`
--

LOCK TABLES `etapas` WRITE;
/*!40000 ALTER TABLE `etapas` DISABLE KEYS */;
INSERT INTO `etapas` VALUES (1,'Lotes premium ubicados en la playa','En nuestra primera etapa estaremos lanzando lotes ubicados en la playa. ¿Qué esperas para disfrutar?');
/*!40000 ALTER TABLE `etapas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lote_planos`
--

DROP TABLE IF EXISTS `lote_planos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lote_planos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lote_id` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lote_id` (`lote_id`),
  CONSTRAINT `lote_planos_ibfk_1` FOREIGN KEY (`lote_id`) REFERENCES `lotes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lote_planos`
--

LOCK TABLES `lote_planos` WRITE;
/*!40000 ALTER TABLE `lote_planos` DISABLE KEYS */;
INSERT INTO `lote_planos` VALUES (1,1,'Plano A - Moderno','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&h=400&fit=crop','Diseño contemporáneo con líneas limpias',1,'2026-03-07 21:47:33'),(2,1,'Plano B - Clásico','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=400&fit=crop','Distribución tradicional y funcional',1,'2026-03-07 21:47:33'),(3,1,'Plano C - Premium','https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=500&h=400&fit=crop','Espacios amplios y de lujo',1,'2026-03-07 21:47:33'),(4,2,'Plano A - Compacto','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=400&fit=crop','Perfecto para familias pequeñas',1,'2026-03-07 21:47:33'),(5,2,'Plano B - Amplio','https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=400&fit=crop','Mayor área de vida',1,'2026-03-07 21:47:33'),(6,2,'Plano C - Funcional','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=400&fit=crop','Distribución óptima del espacio',1,'2026-03-07 21:47:33'),(7,1,'Plano Premium 200m²','https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=800','Diseño de 4 habitaciones con vista al mar, sala amplia y cocina moderna',1,'2026-03-07 22:41:04'),(8,1,'Plano Deluxe 220m²','https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800','Diseño de 5 habitaciones, 3 baños, terraza panorámica',1,'2026-03-07 22:41:04'),(9,1,'Plano Executive 250m²','https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800','Diseño premium con estudio, 4 habitaciones, piscina privada',1,'2026-03-07 22:41:04'),(10,2,'Plano Familiar 120m²','https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800','Diseño compacto con 2 habitaciones, ideal para familias pequeñas',1,'2026-03-07 22:41:05'),(11,2,'Plano Moderno 150m²','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800','Diseño moderno con 3 habitaciones y espacio de trabajo',1,'2026-03-07 22:41:05'),(12,2,'Plano Confort 180m²','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800','Diseño espacioso con 3 habitaciones, 2 baños y jardín',1,'2026-03-07 22:41:05'),(13,3,'Plano Vista Mar 180m²','https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800','Diseño con ventanales panorámicos, 3 habitaciones con vista al mar',1,'2026-03-07 22:41:05'),(14,3,'Plano Mediterráneo 200m²','https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800','Estilo mediterráneo con terraza amplia y piscina',1,'2026-03-07 22:41:05'),(15,3,'Plano Sunset 230m²','https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800','Diseño de lujo con roof garden y jacuzzi',1,'2026-03-07 22:41:05');
/*!40000 ALTER TABLE `lote_planos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lotes`
--

DROP TABLE IF EXISTS `lotes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lotes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero_lote` varchar(20) NOT NULL,
  `area_m2` int NOT NULL,
  `precio` decimal(12,2) NOT NULL,
  `estado` enum('disponible','reservado','vendido') DEFAULT 'disponible',
  `etapa_id` int NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `descripcion` text,
  `habitaciones` int DEFAULT NULL,
  `banos` int DEFAULT NULL,
  `area_construida` decimal(6,2) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `etapa_id` (`etapa_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `lotes_ibfk_1` FOREIGN KEY (`etapa_id`) REFERENCES `etapas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lotes`
--

LOCK TABLES `lotes` WRITE;
/*!40000 ALTER TABLE `lotes` DISABLE KEYS */;
INSERT INTO `lotes` VALUES (1,'L-01',150,180000000.00,'reservado',1,1,'El lote se encuentra ubicado en la playa afueras de la ciudad, con bellas vistas y frente al mar',4,2,200.00,'https://content.arquitecturaydiseno.es/medio/2021/06/17/casa-de-hormigon-en-un-acantilado-de-portugal-85a6f2ee-2000x1250_aa20e247_1500x938.jpg'),(2,'L-02',300,180000000.00,'reservado',1,1,'Lote sencillo para familias pequeñas',2,1,NULL,'https://media.istockphoto.com/id/462772867/es/foto/interior-de-la-ciudad-de-ca%C3%ADda.jpg?s=612x612&w=0&k=20&c=5gRXUQ9U7BY4r4GvWtD28eKjCOZgyi-LRF8_dde9cp0='),(3,'L-03',250,220000000.00,'reservado',1,1,'Lote con vista panorámica al mar, ubicación privilegiada en primera línea de playa',3,2,180.00,'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800');
/*!40000 ALTER TABLE `lotes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagos`
--

DROP TABLE IF EXISTS `pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `monto` decimal(12,2) NOT NULL,
  `fecha_pago` date NOT NULL,
  `comprobante` varchar(255) DEFAULT NULL,
  `compra_id` int NOT NULL,
  `tipo_pago` enum('enganche','cuota','abono_extra') DEFAULT 'cuota',
  `aplicado_a_cuota` int DEFAULT NULL COMMENT 'Número de cuota a la que se aplicó',
  `cuota_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `compra_id` (`compra_id`),
  KEY `cuota_id` (`cuota_id`),
  CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`compra_id`) REFERENCES `compra` (`id`),
  CONSTRAINT `pagos_ibfk_2` FOREIGN KEY (`cuota_id`) REFERENCES `cuotas` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos`
--

LOCK TABLES `pagos` WRITE;
/*!40000 ALTER TABLE `pagos` DISABLE KEYS */;
INSERT INTO `pagos` VALUES (1,5000000.00,'2026-03-01','',1,'cuota',NULL,NULL),(2,9000000.00,'2026-03-01','12',1,'cuota',NULL,NULL),(3,120000.00,'2026-03-02','',1,'cuota',NULL,NULL),(4,6000000.00,'2026-03-02',NULL,1,'cuota',NULL,NULL),(5,10000000.00,'2026-03-02',NULL,1,'cuota',NULL,NULL),(6,90000000.00,'2026-03-02',NULL,1,'cuota',NULL,NULL),(7,5000000.00,'2026-03-02',NULL,1,'cuota',NULL,NULL),(8,50000000.00,'2026-03-02',NULL,1,'cuota',NULL,NULL),(9,4000000.00,'2026-03-02',NULL,1,'cuota',NULL,NULL),(10,800.00,'2026-03-02',NULL,1,'cuota',NULL,NULL),(11,800000.00,'2026-03-02',NULL,1,'cuota',NULL,NULL),(12,79000.00,'2026-03-02',NULL,1,'cuota',NULL,NULL),(13,200.00,'2026-03-02',NULL,1,'cuota',NULL,NULL),(14,36000000.00,'2026-03-07','Pago inicial',2,'enganche',NULL,NULL),(15,13000000.00,'2026-03-07',NULL,2,'cuota',1,1),(16,44000000.00,'2026-03-07','Pago inicial',3,'enganche',NULL,NULL),(17,90000000.00,'2026-03-07',NULL,3,'cuota',1,13);
/*!40000 ALTER TABLE `pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pqrs`
--

DROP TABLE IF EXISTS `pqrs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pqrs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `tipo` enum('Petición','Queja','Reclamo','Sugerencia') NOT NULL,
  `asunto` varchar(150) NOT NULL,
  `descripcion` text NOT NULL,
  `respuesta` text,
  PRIMARY KEY (`id`),
  KEY `fk_pqrs_usuario` (`usuario_id`),
  CONSTRAINT `fk_pqrs_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pqrs`
--

LOCK TABLES `pqrs` WRITE;
/*!40000 ALTER TABLE `pqrs` DISABLE KEYS */;
INSERT INTO `pqrs` VALUES (1,1,'Sugerencia','Falta de ortografía','hay faltas de ortografía grave en la seccion de Proyecto','lo tendremos pendiente, gracias idolo, leyenda, no simp'),(2,1,'Queja','estafa','el Lote es una estafa no he tenido respuesta','hola, eso fue un error del sistema, ya lo corregimos, gracias sapo'),(3,1,'Petición','dsdafdsfdsfdshsdfjkhjdkfa','shdfjkhadsjkhdsfkjadshfjkdhf',NULL);
/*!40000 ALTER TABLE `pqrs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'cliente'),(2,'administrador');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_usuario` varchar(255) NOT NULL,
  `correo` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol_id` int NOT NULL,
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `correo` (`correo`),
  KEY `rol_id` (`rol_id`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Farick Dick','miwepew655@pazuric.com','$2b$10$GSdgbrKVFVf7iYZBRHRKlesSJwJgYTHrq48gBNdOT10En2RzdC7Wm',1,'2026-03-01 21:24:12'),(2,'test','test@mail.com','$2b$10$jSFrcpM25qRG0rmbSTiDkuyl7O6qbr5qUy9Dr8zEfxI4OjmfZi3LS',1,'2026-03-01 22:10:33'),(3,'El mera','admin@test.com','$2b$10$GSdgbrKVFVf7iYZBRHRKlesSJwJgYTHrq48gBNdOT10En2RzdC7Wm',2,'2026-03-02 02:52:08'),(4,'test','miwespew655@pazuric.com','$2b$10$VyYkEHOA7te9unc4f6hKYuq9EVskyAOKrrUSwGLzHl6tVCl/a6rmO',1,'2026-03-07 12:36:17'),(5,'test','miwedspew655@pazuric.com','$2b$10$zJ2JZllDMSOplsNioxyFQu6zB8ycm66mrTfI3D4n.yr499kI7XTiq',1,'2026-03-07 12:37:19'),(6,'Local Test','testlocal1772910294@mail.com','$2b$10$1Vp.KR1Jy9A2wvZgnizBX.O2wxSjcJ/SnwqL2ARNqQJUrc/CwZ7Xy',1,'2026-03-07 19:04:54');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-07 19:13:10
