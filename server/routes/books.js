module.exports = function () {
    const mysql = require('../conf/db');
    const express = require('express');
    const app = express();

    app.get('/', function (req, res, next) {
        //todo: get rating of every book too
        const query = `SELECT book.id, book.title, category.name, 
                       user.first_name, user.last_name, book.year from book
                       INNER JOIN category ON book.category_id = category.id
                       INNER JOIN written ON written.book_id = book.id
                       INNER JOIN user on user.id = written.author_id`;

        mysql.query(query, function (err, rows) {
            if (err) {
                next(err);
            } else {
                res.send(rows);
            }
        });
    });

    app.post('/', addBook);

    app.put('/:id', function (req, res) {
        const id = req.params.id;
        const {title, year, plot, category} = req.body;
        const query = `UPDATE book SET 
                       title = '${title}', 
                       year = '${year}',
                       plot = '${plot}',
                       category_id = '${category}'
                       WHERE id = ${id}`;

        mysql.query(query, function (err) {
            if (err) {
                next(err);
            } else {
                res.send({
                    success: true
                });
            }
        });

    });

    app.delete('/:id', function (req, res) {
        const id = req.params.id;
        const query = `DELETE from book WHERE id = ${id}`;

        mysql.query(query, function (err) {
            if (err) {
                next(err);
            } else {
                res.send({
                    success: true
                });
            }
        })
    });

    function addBook(req, res, next) {
        const {title, year, plot, category_id} = req.body;
        const values = [title, year, plot, category_id];
        const query = `INSERT INTO book (title, year, plot, category_id) 
                       VALUES (?, ?, ?, ?);`;

        mysql.query(query, values, function (err) {
            if (err) {
                next(err);
            } else {
                updateWrittenTable(req, res, next);
            }
        });
    }

    function updateWrittenTable(req, res, next) {
        let query = `SELECT MAX(id) from book`;

        mysql.query(query, function (err, rows) {
            if (err) {
                next(err);
            } else {
                const authorID = req.session.user.id;
                const bookID = rows[0] && rows[0]['MAX(id)'];

                if (bookID) {
                    insertIntoWrittenTable(authorID, bookID, res, next);
                } else {
                    next(err);
                }
            }
        });
    }

    function insertIntoWrittenTable(authorID, bookID, res, next) {
        const query = `INSERT INTO written (author_id, book_id) 
                       VALUES ('${authorID}', '${bookID}')`;

        mysql.query(query, function (err) {
           if (err) {
               next(err);
           } else {
               res.send({
                   success: true
               })
           }
        });
    }

    return app;
}();