var mysql = require("mysql");
var inquirer = require("inquirer");
var cTable = require("console.table");

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

function getData(table, cb){ 
    connection.query(`SELECT * FROM ${table}`, function (err, data) {
        if (err) throw err
        cb(data)
    });
}

async function mainPrompt(){
    const requestType = await inquirer.prompt([
        {
            type: "list",
            name: "requestChoice",
            message: "What would you like to do?",
            choices: ["Add departments, roles, or employees","View departments, roles, employees","Update employee roles or managers", "View employees by manager", "View department budgets"]
        }
    ])
    .then(requestType => {
        if (requestType.requestChoice === "Add departments, roles, or employees"){
            addData();
        }
        else if (requestType.requestChoice === "View departments, roles, employees"){
            viewData();
        }
        else if (requestType.requestChoice === "Update employee roles or managers"){
            updateData();
        }
        else if (requestType.requestChoice === "View employees by manager"){
            mgrData();
        }
        else if (requestType.requestChoice === "View department budgets"){
            deptBudget();
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
            SELECT CONCAT(e.first_name, ' ' ,e.last_name) AS 'employee', CONCAT(m.first_name, ' ' ,m.last_name) AS 'manager', title, department, salary
            FROM employees e
            LEFT JOIN employees m ON m.id = e.manager_id
            LEFT JOIN roles ON e.role_id=roles.id
            LEFT JOIN departments ON roles.department_id=departments.id;
            `, function (err, data) {
                if (err) throw err
                console.log("");
                console.log(`---------------------------   ${dataType.dataChoice.toUpperCase()}   --------------------------`);
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
        console.log(`${deptAnswers.name} department has been added.`)
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
                console.log(`${roleAnswers.title} role has been added.`)
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
                    console.log(`${empAnswers.firstName} ${empAnswers.lastName} has been added as an employee.`)
                    mainPrompt();
                })
        })
    })
}

async function updateData() {
    let updateAnswers = inquirer.prompt([
        {
            type: "list",
            name: "updateChoice",
            message: "Would you like to update an Employee's role or manager?",
            choices:["Role", "Manager"]
        }
    ])
        .then(updateAnswers => {
            if (updateAnswers.updateChoice === "Role"){
                updateRole();
            }
            else {
                updateManager();
            }
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
            console.log(`Employee's role has been changed.`)
            mainPrompt();
        })
    })
}

async function updateManager() {
    getData("employees", function (employees) {
        let mgrAssign = inquirer.prompt([
            {
                type: "list",
                name: "empToChange",
                message: "Select the name of the employee who's manager you want to change",
                choices: employees.map(emp1 => {
                    return {
                        name: emp1.first_name + " " + emp1.last_name,
                        value: emp1.id
                    }
                })
            },
            {
                type: "list",
                name: "newMgr",
                message: "Select the new manager for the selected employee",
                choices: employees.map(emp2 => {
                    return {
                        name: emp2.first_name + " " + emp2.last_name,
                        value: emp2.id
                    }
                })
            }

        ])
        .then(mgrAssign => {
            connection.query(`UPDATE employees SET manager_id = ${mgrAssign.newMgr} where id = ${mgrAssign.empToChange}`,
                function (err, res) {
                    if (err) throw err;
                }
            )
        console.log(`You have changed the selected employee's manager`);
        mainPrompt();
        })
    })
}

async function mgrData() {
    getData("employees", function (employees) {
        let mgrChoice = inquirer.prompt([
            {
                type: "list",
                name: "managerId",
                message: "Select a manager",
                choices: employees.map(emp => {
                    return {
                        name: emp.first_name + " " + emp.last_name,
                        value: emp.id
                    }
                })
            }
        ])
        .then(mgrChoice => {
            connection.query(`
            SELECT CONCAT(m.first_name, ' ' ,m.last_name) AS 'manager', CONCAT(e.first_name, ' ' ,e.last_name) AS 'employee'
            FROM employees e
            INNER JOIN employees m ON m.id = e.manager_id
            WHERE m.id=${mgrChoice.managerId};`, function (err, data) {
                if (err) throw err
                console.log("");
                console.table(data);
            });
            mainPrompt();
        })
    })
}

async function deptBudget(){
    getData("departments", function(departments){
        let deptBudget = inquirer.prompt([
            {
                type: "list",
                name: "deptName",
                message: "Select the name of the department you would like to view the budget of",
                choices: departments.map(dept => {
                    return {
                        name: dept.department,
                        value: dept.id
                    }
                })
            }            
        ])
        .then(deptBudget => {
            let budget = 0;
            connection.query(`
                SELECT salary
                FROM employees
                LEFT JOIN roles ON role_id=roles.id
                LEFT JOIN departments ON roles.department_id=departments.id
                WHERE department_id=${deptBudget.deptName};`, function (err, data) {
                    if (err) throw err
                    for (let i=0; i<data.length; i++){
                        budget += data[i].salary
                    }
                    console.log(`The total budget of the department is ${budget}`);
                }
            )
            mainPrompt();
        })
    })
}

mainPrompt();
