var express = require("express");
var mysql = require("mysql");
var inquirer = require("inquirer");
var cTable = require("console.table");

var app = express();

// Set the port of our application
// process.env.PORT lets the port be set by Heroku
var PORT = process.env.PORT || 7070;

// Sets up the Express app to handle data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "rootroot",
  database: "employees"
});

connection.connect(function(err) {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }

  console.log("connected as id " + connection.threadId);
});

// Start our server so that it can begin listening to client requests.
app.listen(PORT, function() {
  // Log (server-side) when our server has started
  console.log("Server listening on: http://localhost:" + PORT);
});

async function mainPrompt(){
    const requestType = await inquirer.prompt([
        {
            type: "list",
            name: "requestChoice",
            message: "What would you like to do?",
            choices: ["Add departments, roles, or employees","View departments, roles, or employees","Update employee roles"]
        }
    ])
    .then(requestType => {
        if (requestType.requestChoice === "Add departments, roles, or employees"){
            addData();
        }
        else if (requestType.requestChoice === "View departments, roles, or employees"){
            viewData();
        }
        else if (requestType.requestChoice === "Update employee roles"){
            updateRole();
        }
    });   
}

async function viewData() {
    let dataType = await inquirer.prompt([
        {
            type: "list",
            name: "dataChoice",
            message: "What would you like to view?",
            choices: ["departments", "roles", "employees"]
        }
    ])
    .then(dataType => {
        if (dataType.dataChoice === "employees") {
            connection.query(`
            SELECT first_name, last_name, title, salary, department from employees
            RIGHT JOIN roles ON employees.role_id=roles.id
            RIGHT JOIN departments ON roles.department_id=departments.id;
            `, function (err, data) {
                if (err) throw err
                console.log("");
                console.log(`-----------------   ${dataType.dataChoice.toUpperCase()}   -----------------`);
                console.table(data);
            });
        }
        else if (dataType.dataChoice === "departments") {
            connection.query(`SELECT * from departments;`, function (err, data) {
                if (err) throw err
                console.log("");
                console.log(`-----------------   ${dataType.dataChoice.toUpperCase()}   -----------------`);
                console.table(data);
            });
        }
        else if (dataType.dataChoice === "roles") {
            connection.query(`SELECT title, salary from roles;`, function (err, data) {
                if (err) throw err
                console.log("");
                console.log(`-----------------   ${dataType.dataChoice.toUpperCase()}   -----------------`);
                console.table(data);
            });
        }
    })
    mainPrompt();
}

async function addData() {
    let dataType = await inquirer.prompt([
        {
            type: "list",
            name: "dataChoice",
            message: "What category would you like to add to?",
            choices: ["departments", "roles", "employees"]
        }
    ])
    .then(dataType => {
        if (dataType.dataChoice === "departments") {
            addDept()
        }
        else if (dataType.dataChoice === "roles") {
            addRole()
        }
        else if (dataType.dataChoice === "employees") {
            addEmployee()
        }
    })         
}

async function addDept() {
    let deptAnswers = await inquirer.prompt([
        {
            type: "input",
            name: "name",
            message: "Enter the name of the new department"
        }
    ])
    .then(deptAnswers => {
        connection.query(`INSERT INTO departments (department) VALUES ("${deptAnswers.name}")`,
            function (err, res) {
                if (err) throw err;
            }
        )
        mainPrompt();
    })
}

async function addRole() {
    getData("departments", function (departments) {
        let roleAnswers = inquirer.prompt([
            {
                type: "input",
                name: "title",
                message: "Enter the title of the role"
            },
            {
                type: "input",
                name: "salary",
                message: "Enter the salary of the role"
            },
            {
                type: "list",
                name: "deptId",
                message: "Select the department of the role",
                choices: departments.map(depts => {
                    return {
                        name: depts.department,
                        value: depts.id
                    }
                })
            }
        ])
            .then(roleAnswers => {
                connection.query(`INSERT INTO roles (title, salary, department_id) VALUES ("${roleAnswers.title}", "${roleAnswers.salary}", "${roleAnswers.deptId}")`,
                    function (err, res) {
                        if (err) throw err;
                    }
                )
                mainPrompt();
            })
    })
}

async function addEmployee() {
    getData("employees", function (employees) {
        getData("roles", function (roles) {
            let empAnswers = inquirer.prompt([
                {
                    type: "input",
                    name: "firstName",
                    message: "Enter the Employee's first name"
                },
                {
                    type: "input",
                    name: "lastName",
                    message: "Enter the Employee's last name"
                },
                {
                    type: "list",
                    name: "roleId",
                    message: "Select the Employee's role",
                    choices: roles.map(role => {
                        return {
                            name: role.title,
                            value: role.id
                        }
                    })
                },
                {
                    type: "list",
                    name: "managerId",
                    message: "Select the Employee's manager",
                    choices: employees.map(emp => {
                        return {
                            name: emp.first_name + " " +emp.last_name,
                            value: emp.id
                        }
                    })
                }
            ])
                .then(empAnswers => {
                    connection.query(`INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES ("${empAnswers.firstName}", "${empAnswers.lastName}", "${empAnswers.roleId}", "${empAnswers.managerId}")`,
                        function (err, res) {
                            if (err) throw err;
                        }
                    )
                    mainPrompt();
                })
        })
    })
}

async function updateRole() {
    getData("employees", function (employees) {
        let roleAnswers = inquirer.prompt([
            {
                type: "list",
                name: "empToChange",
                message: "Select the name of the employee who's role you want to change",
                choices: employees.map(emp => {
                    return {
                        name: emp.first_name + " " + emp.last_name,
                        value: emp.id
                    }
                })
            }
        ])
        .then(roleAnswers => {
            assignRole(roleAnswers.empToChange);
        })
    })
}

function assignRole(assignee) {
    getData("roles", function (roles) {
        let roleInput = inquirer.prompt([
            {
                type: "list",
                name: "newRole",
                message: "Select the new role for the selected employee",
                choices: roles.map(role => {
                    return {
                        name: role.title,
                        value: role.id
                    }
                })
            }
        ])
        .then(roleInput => {
            connection.query(`UPDATE employees SET role_id = ${roleInput.newRole} where id = ${assignee}`,
                function (err, res) {
                    if (err) throw err;
                }
            )
            mainPrompt();
        })
    })
}


function getData(table, cb){
    connection.query(`SELECT * FROM ${table}`, function (err, data) {
        if (err) throw err
        cb(data)
    });
}

mainPrompt();
