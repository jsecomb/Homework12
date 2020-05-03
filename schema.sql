DROP DATABASE IF EXISTS employees;

CREATE DATABASE employees;

USE employees;

CREATE TABLE departments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  department VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(30) UNIQUE NOT NULL,
  salary DECIMAL UNSIGNED NOT NULL,
  department_id INT UNSIGNED NOT NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE employees (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(30) NOT NULL,
  last_name VARCHAR(30) NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  manager_id INT UNSIGNED,
  FOREIGN KEY (manager_id) REFERENCES employees(id)
);

INSERT INTO departments (department)
VALUES ("Accounting");
INSERT INTO roles (title, salary, department_id)
VALUES ("Accountant", 75000, 1);
INSERT INTO employees (first_name, last_name, role_id, manager_id)
VALUES ("Randy", "McDorgald", 1, 1);


