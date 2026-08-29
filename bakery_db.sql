-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 29, 2026 at 10:08 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bakery_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `bakery_items`
--

CREATE TABLE `bakery_items` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category` varchar(50) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` text DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `bakery_items`
--

INSERT INTO `bakery_items` (`id`, `name`, `category`, `price`, `description`, `image_url`, `is_available`, `created_at`) VALUES
(1, 'Croissant Butter Rich', 'Pastry', 85.00, 'ครัวซองต์เนยสดแท้จากฝรั่งเศส หอมกรอบนอกนุ่มใน เป็นชั้นสวยงาม', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=600', 1, '2026-08-29 07:32:19'),
(2, 'Strawberry Shortcake', 'Cake', 145.00, 'สตรอว์เบอร์รีชอร์ตเค้ก เนื้อเค้กสปันจ์นุ่มนิ่ม สลับชั้นครีมสดและสตรอว์เบอร์รีสด', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=600', 1, '2026-08-29 07:32:19'),
(3, 'Matcha Soft Cookie', 'Cookie', 65.00, 'คุกกี้ชาเขียวมัทฉะเข้มข้นสอดไส้ไวท์ช็อกโกแลต ชิ้นใหญ่หนานุ่ม', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=600', 1, '2026-08-29 07:32:19'),
(4, 'Shokupan Milk Bread', 'Bread', 120.00, 'ขนมปังปอนด์สไตล์ญี่ปุ่น ปล่อยนุ่มขอบบาง หอมกลิ่นนมสดแท้', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600', 1, '2026-08-29 07:32:19'),
(5, 'Sourdough', 'Bread', 85.00, 'ซาวโดวจ์ หรือ Sourdough คือ ขนมปังหมัก ที่มีรสเปรี้ยวหรือเปรี้ยวไปจนถึงขม เป็นขนมปังที่เกิดจากการหมักของยีสต์ตามธรรมชาติโดยใช้ แป้ง เกลือ และน้ำ ชื่อของขนมปัง ซาวโดวจ์ ได้มาจากรสชาติของมันที่มีรสเปรี้ยวเล็กน้อยจากกรดแลคติกที่เกิดขึ้นระหว่างตอนหมักตามธรรมชาติ โดยจะมีกลิ่นหอม และรสชาติที่มีเอกลักษณ์เป็นของตัวเอง เป็นขนมปังเปลือกแข็งที่รสสัมผัสให้ความเหนียวนุ่มและมีฟองอากาศอยู่ภายใน', 'https://api2.krua.co/wp-content/uploads/2021/12/ArticlePic_1670x1095_-8-scaled.jpg', 1, '2026-08-29 07:59:05');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bakery_items`
--
ALTER TABLE `bakery_items`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bakery_items`
--
ALTER TABLE `bakery_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
