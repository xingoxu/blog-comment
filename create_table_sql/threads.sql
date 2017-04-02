CREATE TABLE IF NOT EXISTS `threads` (
  `thread_id` INT(11) NOT NULL AUTO_INCREMENT,
  `thread_key` VARCHAR(60) NULL DEFAULT NULL,
  `thread_url` VARCHAR(300) NULL DEFAULT NULL,
  `thread_likes` INT(11) NULL DEFAULT NULL,
  `thread_title` VARCHAR(100) NULL DEFAULT NULL,
  PRIMARY KEY (`thread_id`))
DEFAULT CHARACTER SET = utf8mb4_unicode_ci;
