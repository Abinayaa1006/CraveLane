CREATE DATABASE  IF NOT EXISTS `railway` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `railway`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: gondola.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	8.4.13

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
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer` (
  `Customer_ID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Phone` varchar(15) DEFAULT NULL,
  `Password` varchar(255) NOT NULL,
  `Address` text,
  `City` varchar(50) DEFAULT NULL,
  `Pincode` varchar(10) DEFAULT NULL,
  `Role` varchar(20) NOT NULL DEFAULT 'customer',
  PRIMARY KEY (`Customer_ID`),
  UNIQUE KEY `Email` (`Email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer`
--

LOCK TABLES `customer` WRITE;
/*!40000 ALTER TABLE `customer` DISABLE KEYS */;
INSERT INTO `customer` VALUES (2,'Abinayaa V','abinayaa.test@gmail.com','7558165847','scrypt:32768:8:1$DemJvAb7FQfpbpbd$96e8876ccac8963856589e3645ff178433e6df00ed8311b51c3b80a5b03077d71a9fd6a0d23ffad0ddf4605a2be2797afeb842c418fcfc0d9cfbe256774d219f','Plot No-2D,Mathura Illam,Pandian Salai 2nd Street,Neelankarai','Chennai','600115','admin'),(3,'Hamar','hamar.test@gmail.com','7687765444','scrypt:32768:8:1$qz7HTXP0OiH9DyfN$1179070bfd8784b3429dbdcc53e32ad78e24eb54ff2f2ea1623a51cac38a711b05db93b660b68df8c7c33b7049ddc58ef1ebec32289cc6f0e2f3e5f10a354966','kerala','kerala','600001','customer'),(4,'Abinayaa V','abinayaa1006@gmail.com','7558165847','scrypt:32768:8:1$IUOh6bgriWM4Ertq$e40e5359ccab9ec9b9e931caa9c8d050e3e64b017210e676b65a56ee42382ccda538c5dc05e8c65c99497696c323c39d5934275b0902f73785e30aab2d1a2970','Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','customer'),(5,'Abinayaa V','vabinayaa10@gmail.com','7687567422','scrypt:32768:8:1$AGmqXxona134PEHg$d9dc3b2766b77e7db274dba3ec5d44412c4fdb7a7716e414f2d7fe6f37e6ac9a392d20f8c388351af0c78a6bb7045285fb8ecfa26750ea60c4c82a31ac555016','Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','customer'),(6,'Guhaprian','guhaprianv@gmail.com','7358019744','scrypt:32768:8:1$A9vjigNB0ejdzCOe$07114ee208ce60bde34cd03e2f210bd4f57181e51791cf9809604ea5f3ab962b7e8dca94847997ec65b8d56721337a8a5e6d4431202f813eb12cd70969e44105','9/16 sixteen pillars Mandapam street, \nChidambaram','Chidambaram','608001','customer');
/*!40000 ALTER TABLE `customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu`
--

DROP TABLE IF EXISTS `menu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu` (
  `Menu_ID` int NOT NULL AUTO_INCREMENT,
  `Restaurant_ID` int NOT NULL,
  `Item_Name` varchar(100) NOT NULL,
  `Description` text,
  `Price` decimal(10,2) NOT NULL,
  `Category` varchar(50) DEFAULT NULL,
  `Availability` tinyint(1) DEFAULT '1',
  `Image_URL` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`Menu_ID`),
  KEY `Restaurant_ID` (`Restaurant_ID`),
  CONSTRAINT `menu_ibfk_1` FOREIGN KEY (`Restaurant_ID`) REFERENCES `restaurant` (`Restaurant_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu`
--

LOCK TABLES `menu` WRITE;
/*!40000 ALTER TABLE `menu` DISABLE KEYS */;
INSERT INTO `menu` VALUES (1,1,'Paneer Butter Masala','Creamy Paneer Curry',220.00,'Main Course',1,'https://hospitalitycareerprofile.com/uploads/images/202605/image_1200x800_69f84b925ad94.webp?utm_source=chatgpt.com'),(2,1,'Butter Naan','Soft Indian Naan',60.00,'Bread',1,'https://jaiindiankitchen.com/media/products/butter-naan-jai-indian-kitchen.jpeg?utm_source=chatgpt.com'),(3,1,'Veg Biryani','Aromatic Vegetable Biryani',180.00,'Rice',1,'https://b.zmtcdn.com/data/pictures/chains/0/21450550/172719443780bf9dcf-9d47-4874-9fd4-64889f60cfec.png?utm_source=chatgpt.com'),(4,2,'Margherita Pizza','Classic Cheese Pizza',250.00,'Pizza',1,'https://zucchini.co.ke/cdn/shop/files/20220211142645-margherita-9920.webp?v=1754662141&utm_source=chatgpt.com'),(5,2,'Farmhouse Pizza','Loaded Vegetable Pizza',320.00,'Pizza',1,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTa17TFoTW5heyDUM5peDbWhQ7461WLB0aFBxWb-7oDdm6eUeLdIuItSjw&s=10'),(6,2,'Garlic Bread','Crispy Garlic Bread',150.00,'Sides',1,'https://snapcalorie-webflow-website.s3.us-east-2.amazonaws.com/media/food_pics_v2/garlic_bread.jpg?utm_source=chatgpt.com'),(7,3,'Veg Noodles','Stir-Fried Noodles',190.00,'Noodles',1,'https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy%2Cf_auto%2Cq_auto/FOOD_CATALOG/IMAGES/CMS/2025/11/10/c00de345-c469-46d7-a4e5-a46d03c91fcf_42bbd38b-4d67-42df-872b-1cdac6ffc49d.jpg?utm_source=chatgpt.com'),(8,3,'Veg Fried Rice','Chinese Style Fried Rice',180.00,'Rice',1,'https://static.vecteezy.com/system/resources/thumbnails/040/986/112/small/ai-generated-indian-biryani-rice-professional-advertising-foodgraphy-photo.jpg'),(9,4,'Veg Buddha Bowl','Healthy Vegetable Bowl',280.00,'Healthy',1,'https://recettox.com/cdn-cgi/image/fit%3Dcontain%2Cwidth%3D768%2Cquality%3D80%2Cformat%3Dauto%2C/assets/images/1751732021084-1cufvqi6.webp?utm_source=chatgpt.com'),(10,4,'Avocado Salad','Fresh Avocado Salad',250.00,'Salad',1,'https://snapcalorie-webflow-website.s3.us-east-2.amazonaws.com/media/food_pics_v2/medium/avocado_salad_with_red_onion_and_tomato.jpg?utm_source=chatgpt.com');
/*!40000 ALTER TABLE `menu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_item`
--

DROP TABLE IF EXISTS `order_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_item` (
  `Order_Item_ID` int NOT NULL AUTO_INCREMENT,
  `Order_ID` int NOT NULL,
  `Menu_ID` int NOT NULL,
  `Quantity` int NOT NULL,
  `Unit_Price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`Order_Item_ID`),
  KEY `fk_orderitem_order` (`Order_ID`),
  KEY `fk_orderitem_menu` (`Menu_ID`),
  CONSTRAINT `fk_orderitem_menu` FOREIGN KEY (`Menu_ID`) REFERENCES `menu` (`Menu_ID`),
  CONSTRAINT `fk_orderitem_order` FOREIGN KEY (`Order_ID`) REFERENCES `orders` (`Order_ID`),
  CONSTRAINT `chk_orderitem_quantity` CHECK ((`Quantity` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_item`
--

LOCK TABLES `order_item` WRITE;
/*!40000 ALTER TABLE `order_item` DISABLE KEYS */;
INSERT INTO `order_item` VALUES (1,1,8,1,180.00),(2,2,1,1,220.00),(3,3,1,1,220.00),(4,4,1,1,220.00),(5,5,1,1,220.00),(6,6,5,1,320.00),(7,7,3,1,180.00),(8,8,10,1,250.00),(9,9,3,1,180.00),(10,9,6,1,150.00),(11,10,7,1,190.00),(12,11,8,1,180.00),(13,12,3,1,180.00),(14,13,3,1,180.00),(15,14,3,1,180.00),(16,15,3,1,180.00),(17,16,3,1,180.00),(18,17,3,1,180.00),(19,18,3,1,180.00),(20,19,3,1,180.00),(21,20,3,1,180.00),(22,21,1,2,220.00),(23,22,1,2,220.00),(24,23,1,1,220.00),(25,24,1,1,220.00),(26,25,1,1,220.00),(27,26,1,1,220.00),(28,27,1,1,220.00),(29,28,1,1,220.00),(30,29,1,1,220.00),(31,30,1,1,220.00);
/*!40000 ALTER TABLE `order_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `Order_ID` int NOT NULL AUTO_INCREMENT,
  `Customer_ID` int NOT NULL,
  `Order_Date` datetime DEFAULT CURRENT_TIMESTAMP,
  `Total_Amount` decimal(10,2) NOT NULL,
  `Delivery_Address` text NOT NULL,
  `City` varchar(50) DEFAULT NULL,
  `Pincode` varchar(10) DEFAULT NULL,
  `Order_Status` varchar(30) DEFAULT 'Pending',
  `Payment_Method` varchar(30) DEFAULT NULL,
  `Payment_Status` varchar(30) DEFAULT 'Pending',
  `Razorpay_Order_ID` varchar(100) DEFAULT NULL,
  `Razorpay_Payment_ID` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`Order_ID`),
  UNIQUE KEY `uq_orders_razorpay_order_id` (`Razorpay_Order_ID`),
  UNIQUE KEY `uq_orders_razorpay_payment_id` (`Razorpay_Payment_ID`),
  KEY `fk_orders_customer` (`Customer_ID`),
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`Customer_ID`) REFERENCES `customer` (`Customer_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,2,'2026-10-09 11:42:55',180.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street,Neelankarai','Chennai','600115','Delivered','Cash on Delivery','Pending',NULL,NULL),(2,2,'2026-10-09 11:45:22',220.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street,Neelankarai','Chennai','600115','Out for Delivery','UPI (Demo)','Simulated',NULL,NULL),(3,2,'2026-10-09 11:50:01',220.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street,Neelankarai','Chennai','600115','Pending','Cash on Delivery','Pending',NULL,NULL),(4,2,'2026-10-09 12:04:57',220.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street,Neelankarai','Chennai','600115','Pending','Cash on Delivery','Pending',NULL,NULL),(5,2,'2026-10-22 23:35:02',220.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street,Neelankarai','Chennai','600115','Pending','UPI (Demo)','Simulated',NULL,NULL),(6,2,'2026-10-22 23:37:31',320.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street,Neelankarai','Chennai','600115','Pending','UPI (Demo)','Simulated',NULL,NULL),(7,2,'2026-10-23 09:51:10',180.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street,Neelankarai','Chennai','600115','Pending','Cash on Delivery','Pending',NULL,NULL),(8,2,'2026-10-23 09:51:46',250.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street,Neelankarai','Chennai','600115','Out for Delivery','Cash on Delivery','Pending',NULL,NULL),(9,2,'2026-10-30 12:22:41',330.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street,Neelankarai','Chennai','600115','Out for Delivery','UPI (Demo)','Simulated',NULL,NULL),(10,4,'2026-11-06 10:56:10',190.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Pending','UPI (Demo)','Simulated',NULL,NULL),(11,4,'2026-11-06 10:58:47',180.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Delivered','UPI (Demo)','Simulated',NULL,NULL),(12,4,'2026-11-06 11:40:13',180.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Pending','UPI (Razorpay)','Pending','order_TwmmEXBUEHTpIY',NULL),(13,4,'2026-11-06 11:42:45',180.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Pending','UPI (Razorpay)','Pending','order_TwmoulNLf3B4jH',NULL),(14,4,'2026-11-06 12:09:23',180.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Pending','Cards (Razorpay)','Pending','order_TwnH2nNi7UVN0W',NULL),(15,4,'2026-11-06 12:09:34',180.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Pending','Net Banking (Razorpay)','Pending','order_TwnHF8tHTox6K5',NULL),(16,4,'2026-11-06 12:09:46',180.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Pending','Wallets (Razorpay)','Pending','order_TwnHSQlL9AwLjO',NULL),(17,4,'2026-11-06 12:12:10',180.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Pending','Cards (Razorpay)','Pending','order_TwnJzDB5TdfP6X',NULL),(18,4,'2026-11-06 12:13:00',180.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Pending','Net Banking (Razorpay)','Paid','order_TwnKrNDEYt1FM3','pay_TwnKwpoIJzC6Vk'),(19,4,'2026-11-06 12:36:55',180.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Pending','Cards (Razorpay)','Pending','order_Twnk8NYgVN1Lr9',NULL),(20,4,'2026-11-06 12:37:10',180.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Pending','Net Banking (Razorpay)','Paid','order_TwnkOi0dZubssL','pay_TwnkSYOvMtwYih'),(21,4,'2026-11-06 12:53:13',440.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Pending','Cards (Razorpay)','Pending','order_Two1LKuNAkb4Dj',NULL),(22,4,'2026-11-06 12:53:21',440.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Pending','Net Banking (Razorpay)','Paid','order_Two1UuMST6ZYNb','pay_Two1Ymdia4l587'),(23,4,'2026-11-06 13:34:14',220.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Pending','Cards (Razorpay)','Pending','order_TwoifoFAJABjQU',NULL),(24,4,'2026-11-06 13:43:51',220.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Pending','Cards (Razorpay)','Pending','order_TwosorpqjvUytm',NULL),(25,4,'2026-11-06 13:43:59',220.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Pending','Net Banking (Razorpay)','Paid','order_TwosyvUNjEa8i4','pay_Twot7sUPi7Q5vY'),(26,4,'2026-11-08 14:43:12',220.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Pending','Cards (Razorpay)','Pending','order_TxiaMlrV2K4dOj',NULL),(27,4,'2026-11-08 14:43:29',220.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Pending','Net Banking (Razorpay)','Paid','order_TxiaeQtCDCKCct','pay_TxianYhNNRYOQj'),(28,4,'2026-11-08 18:23:04',220.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Pending','Wallets (Razorpay)','Paid','order_TxmKcNuv3JQ0y8','pay_TxmKodqcwWXMET'),(29,4,'2026-11-13 11:41:15',220.00,'Plot No-2D,Mathura Illam,Pandian Salai 2nd Street\nNeelankarai','Chennai','600115','Cancelled','Net Banking (Razorpay)','Pending','order_Tze9lG7oGcNOQB',NULL),(30,6,'2026-11-13 11:42:47',220.00,'9/16 sixteen pillars Mandapam street, \nChidambaram','Chidambaram','608001','Pending','Net Banking (Razorpay)','Pending','order_TzeBNftudbyTDc',NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurant`
--

DROP TABLE IF EXISTS `restaurant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant` (
  `Restaurant_ID` int NOT NULL AUTO_INCREMENT,
  `Restaurant_Name` varchar(100) NOT NULL,
  `Description` text,
  `Phone` varchar(15) DEFAULT NULL,
  `Address` text,
  `City` varchar(50) DEFAULT NULL,
  `Rating` decimal(2,1) DEFAULT '0.0',
  `Status` varchar(20) DEFAULT 'Open',
  `Image_URL` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`Restaurant_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant`
--

LOCK TABLES `restaurant` WRITE;
/*!40000 ALTER TABLE `restaurant` DISABLE KEYS */;
INSERT INTO `restaurant` VALUES (1,'Spice Garden','Authentic Indian Cuisine','9876543210','Anna Nagar','Chennai',4.5,'Open','https://images.openai.com/static-rsc-4/AXXVXWs9X-FQRsPAQUyRFZ8NgwGmfWQbu1ZTH9j3UZWaLtRhT6zIvgI1DRHyF_lNRCkds00xI_tmt9Ym2xGNnRyGk7dSpXqn046X4Hh_R4rMyRzA0b9UmcZLWbtFbjIeUd3Q-3xp5ZKVADjXfLMfj5dm6r4FDGrOxr9_VpT-tlw?purpose=inline'),(2,'Pizza Corner','Fresh Pizzas and Italian Dishes','9876543211','Adyar','Chennai',4.3,'Open','https://images.openai.com/static-rsc-4/kL4yDeHHQsOpv75tVrX2IYFQBNl-Ksno_loXrU3JD6EJg1UWWuDr4ZX_gxwpEjy6K6c-vOkd9apsNzIJ2BWXgQAf78Lw7AZ5BqT1NjCADwG-4DPFa9ZtPdCDyVpC3ZeH8g2qABCVxrIZBemvbRmzUo6xCZK-gnmeesx52nzKrbM?purpose=inline'),(3,'Dragon House','Chinese and Asian Cuisine','9876543212','T Nagar','Chennai',4.2,'Open','https://wok-and-sushi-oberkirch.com/assets/images/dish-4.jpg?utm_source=chatgpt.com'),(4,'Green Bowl','Healthy and Vegetarian Food','9876543213','Besant Nagar','Chennai',4.6,'Open','https://www.timeoutdubai.com/cloud/timeoutdubai/2021/10/01/Life%E2%80%99n-one.jpg');
/*!40000 ALTER TABLE `restaurant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review`
--

DROP TABLE IF EXISTS `review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review` (
  `Review_ID` int NOT NULL AUTO_INCREMENT,
  `Customer_ID` int NOT NULL,
  `Restaurant_ID` int NOT NULL,
  `Order_ID` int NOT NULL,
  `Rating` int NOT NULL,
  `Comments` text,
  `Review_Date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Review_ID`),
  UNIQUE KEY `uq_customer_restaurant_order` (`Customer_ID`,`Restaurant_ID`,`Order_ID`),
  KEY `fk_review_restaurant` (`Restaurant_ID`),
  KEY `fk_review_order` (`Order_ID`),
  CONSTRAINT `fk_review_customer` FOREIGN KEY (`Customer_ID`) REFERENCES `customer` (`Customer_ID`),
  CONSTRAINT `fk_review_order` FOREIGN KEY (`Order_ID`) REFERENCES `orders` (`Order_ID`),
  CONSTRAINT `fk_review_restaurant` FOREIGN KEY (`Restaurant_ID`) REFERENCES `restaurant` (`Restaurant_ID`),
  CONSTRAINT `chk_review_rating` CHECK ((`Rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review`
--

LOCK TABLES `review` WRITE;
/*!40000 ALTER TABLE `review` DISABLE KEYS */;
/*!40000 ALTER TABLE `review` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sync_outbox`
--

DROP TABLE IF EXISTS `sync_outbox`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sync_outbox` (
  `Event_ID` bigint NOT NULL AUTO_INCREMENT,
  `Entity_Type` varchar(30) NOT NULL,
  `Entity_ID` bigint NOT NULL,
  `Operation` enum('upsert','delete') NOT NULL DEFAULT 'upsert',
  `Status` enum('pending','processing','processed','failed') NOT NULL DEFAULT 'pending',
  `Created_At` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Processed_At` timestamp NULL DEFAULT NULL,
  `Attempts` int NOT NULL DEFAULT '0',
  `Last_Error` text,
  `Locked_At` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`Event_ID`),
  KEY `idx_sync_status_event` (`Status`,`Event_ID`),
  KEY `idx_sync_entity` (`Entity_Type`,`Entity_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sync_outbox`
--

LOCK TABLES `sync_outbox` WRITE;
/*!40000 ALTER TABLE `sync_outbox` DISABLE KEYS */;
INSERT INTO `sync_outbox` VALUES (1,'restaurant',1,'upsert','processed','2026-11-10 05:36:24','2026-11-10 05:36:34',1,NULL,NULL),(2,'restaurant',1,'upsert','processed','2026-11-10 06:37:06','2026-11-10 06:37:14',1,NULL,NULL),(3,'restaurant',1,'upsert','processed','2026-11-10 06:37:41','2026-11-10 06:37:51',1,NULL,NULL),(4,'restaurant',1,'upsert','processed','2026-11-10 06:39:28','2026-11-10 06:39:40',1,NULL,NULL),(5,'restaurant',1,'upsert','processed','2026-11-10 08:04:13','2026-11-10 08:07:56',1,NULL,NULL),(6,'customer',6,'upsert','processed','2026-11-13 11:28:45','2026-11-13 11:39:28',1,NULL,NULL),(7,'orders',29,'upsert','processed','2026-11-13 11:41:15','2026-11-13 11:55:17',1,NULL,NULL),(8,'orders',30,'upsert','processed','2026-11-13 11:42:47','2026-11-13 11:55:17',1,NULL,NULL),(9,'orders',29,'upsert','processed','2026-11-13 12:21:07','2026-11-13 13:08:31',1,NULL,NULL);
/*!40000 ALTER TABLE `sync_outbox` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-13 18:59:47
