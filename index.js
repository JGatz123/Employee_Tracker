require("dotenv").config()
const mysql = require("mysql2")
const inquirer = require("inquirer")
const db = mysql.createConnection({
host: process.env.DB_HOST,
user: process.env.DB_USER,
database: process.env.DB_NAME,
password: process.env.DB_PASSWORD,
})

function newMainChoice(){
    console.log("\n")
    setTimeout(mainChoice, 100)
}

function query(...args){
    const query = args[0]
    const placeholders = args.slice(1)
    db.execute(query, placeholders, (error, results)=>{
        if (error){
        console.log(error)
            return;
    }
    if (query.toUpperCase().includes("SELECT")){
        console.table(results)
    }
    } )
}
async function mainChoice(){
    const {mainChoice} = await inquirer.prompt([
        {
            name: "mainChoice",
            type: "list",
            message: "what do you want to do",
            choices: [
                "view all departments",
                "view all roles",
                "view all employees",
                "add a department",
                "add a role",
                "add an employee",
                "update an employee role"
            ]
        }
    ])
    if(mainChoice === "view all departments"){
        query("SELECT * FROM department")
        newMainChoice()
    }
    if(mainChoice === "view all roles"){
        query(`
            SELECT role.id, title, department.name, salary 
            FROM role
            JOIN department ON role.department_id = department.id
            order by role.id;
            `)
        newMainChoice()
    }
    if(mainChoice === "view all employees"){
        query(`
        SELECT emp.id, emp.first_name, emp.last_name, role.title, department.name, role.salary, CONCAT(manager.first_name, " ", manager.last_name) AS "manager"
        from employee emp
        LEFT JOIN employee manager ON emp.manager_id = manager.id
        LEFT JOIN role ON emp.role_id = role.id
        LEFT JOIN department ON role.department_id = department.id
        ORDER BY emp.id; 
        `)
        newMainChoice()
    }
    if(mainChoice === "add a department"){
        const {department} = await inquirer.prompt([
            {
                name: "department",
                type: "input",
                message: "What is the name of the department?"
            }
        ]) 
        query("insert into department(name) values (?)", department)
        newMainChoice()
    }
    if(mainChoice === "add a role"){
        db.execute("SELECT * FROM department", async (error, results)=>{
            if(error) return 
            const departments = results.map((dep)=>{
               return {
                name: dep.name,
                value: dep.id
               }
            })
            const {nameOfrole, salaryOfrole, departmentOfrole} = await inquirer.prompt([
                {
                    name: "nameOfrole",
                    type: "input",
                    message: "What is the role?",
                  },
                  {
                    name: "salaryOfrole",
                    type: "input",
                    message: "What is the salary?"
                  },
                  {
                    name: "departmentOfrole",
                    type: "list",
                    message: "What department is this role in?",
                    choices: departments
                  }
            ])
            query("INSERT INTO role(title, salary, department_id) values(?, ?, ?)", nameOfrole, salaryOfrole, departmentOfrole)
            newMainChoice()
        })
    }
    if(mainChoice === "add an employee"){
        // db.execute("SELECT * FROM role", async (error, results)=>{
        //     if(error) return 
        //     const roles = results.map((role)=>{
        //        return {
        //         name: role.name,
        //         value: role.id
        //        }
        //     })
        //     db.execute
        // })
        addEmployee()
    }
    if(mainChoice === "update an employee role"){
        updateEmp()
    }
}
function addEmployee() {
    db.query("SELECT * FROM role", function (err, results) {
      if (err) throw err;
      inquirer.prompt([
        {
          name: "firstName",
          type: "input",
          message: "What is the new employee's first name?"
        },
        {
          name: "lastName",
          type: "input",
          message: "What is the new employee's last name?"
        },
        {
          name: "roleId",
          type: "list",
          choices: results.map(item => item.title),
          message: "Select a role for the employee"
        }
      ]).then(function (answers) {
        const selectedRole = results.find(item => item.title === answers.roleId);
        db.query("INSERT INTO employee SET ?",
          {
            first_name: answers.firstName,
            last_name: answers.lastName,
            role_id: selectedRole.id
          }, function (err, res) {
            if (err) throw err;
            console.log("Added new employee named " + answers.firstName + " " + answers.lastName + "\n");
            newMainChoice();
          })
      })
    })
  };
  
  
  

  
  
  function updateEmp() {
    db.query("SELECT * FROM employee", function (err, res) {
      if (err) throw err;
      inquirer.prompt([
        {
          type: "list",
          name: "selectEmp",
          message: "Select the employee who is changing roles",
          choices: res.map(emp => emp.first_name)
        }
      ]).then(function (answer) {
        const selectedEmp = res.find(emp => emp.first_name === answer.selectEmp);
        db.query("SELECT * FROM role", function (err, res) {
          inquirer.prompt([
            {
              type: "list",
              name: "newRole",
              message: "Select the new role for this employee",
              choices: res.map(item => item.title)
            }
          ]).then(function (answer) {
            const selectedRole = res.find(role => role.title === answer.newRole);
  
            db.query("UPDATE employees SET role_id = ? WHERE id = ?", [selectedRole.id, selectedEmp.id],
              function (error) {
                if (error) throw err;
                newMainChoice();
              }
            );
          })
        })
      })
    })
  };
mainChoice()