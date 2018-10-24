/* eslint-disable */
(function () {
    let temporaryStr;

    function isIE() {
        if (navigator.userAgent.indexOf('rv:11') != -1) {
            return true;
        }
        if (navigator.userAgent.indexOf('MSIE') != -1) {
            return true;
        }
        return false;
    }
    function isSafari() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.indexOf('chrome') > -1 ||
            userAgent.indexOf('firefox') > -1 ||
            userAgent.indexOf('epiphany') > -1) {
            return false;
        }
        if (userAgent.indexOf('safari/') > -1) {
            return true;
        }
        return false;
    }
    function isEdge() {
        const userAgent = navigator.userAgent.toLowerCase();
        return userAgent.indexOf('edge') > -1;
    }




    String.prototype.f = function () {
        const args = arguments;
        return this.replace(/\{\{|\}\}|\{(\d+)\}/g, function (m, n) {
            if (m == '{{') {
                return '{';
            }
            if (m == '}}') {
                return '}';
            }
            return args[n];
        });
    };

    // // Object assign polifill
    if (typeof Object.assign != 'function') {
        // Must be writable: true, enumerable: false, configurable: true
        Object.defineProperty(Object, "assign", {
            value: function assign(target, varArgs) { // .length of function is 2
            'use strict';
            if (target == null) { // TypeError if undefined or null
                throw new TypeError('Cannot convert undefined or null to object');
            }

            var to = Object(target);

            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];

                if (nextSource != null) { // Skip over if undefined or null
                for (var nextKey in nextSource) {
                    // Avoid bugs when hasOwnProperty is shadowed
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                    to[nextKey] = nextSource[nextKey];
                    }
                }
                }
            }
            return to;
            },
            writable: true,
            configurable: true
        });
    }

    // Шаги алгоритма ECMA-262, 5-е издание, 15.4.4.18
    // Ссылка (en): http://es5.github.io/#x15.4.4.18
    // Ссылка (ru): http://es5.javascript.ru/x15.4.html#x15.4.4.18
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function (callback, thisArg) {
        var T, k;
        if (this == null) {
            throw new TypeError(' this is null or not defined');
        }
        // 1. Положим O равным результату вызова ToObject passing the |this| value as the argument.
        var O = Object(this);
        // 2. Положим lenValue равным результату вызова внутреннего метода Get объекта O с аргументом "length".
        // 3. Положим len равным ToUint32(lenValue).
        var len = O.length >>> 0;
        // 4. Если IsCallable(callback) равен false, выкинем исключение TypeError.
        // Смотрите: http://es5.github.com/#x9.11
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }
        // 5. Если thisArg присутствует, положим T равным thisArg; иначе положим T равным undefined.
        if (arguments.length > 1) {
            T = thisArg;
        }
        // 6. Положим k равным 0
        k = 0;
        // 7. Пока k < len, будем повторять
            while (k < len) {
                var kValue;
                // a. Положим Pk равным ToString(k).
                //   Это неявное преобразование для левостороннего операнда в операторе in
                // b. Положим kPresent равным результату вызова внутреннего метода HasProperty объекта O с аргументом Pk.
                //   Этот шаг может быть объединён с шагом c
                // c. Если kPresent равен true, то
                if (k in O) {
                    // i. Положим kValue равным результату вызова внутреннего метода Get объекта O с аргументом Pk.
                    kValue = O[k];
                    // ii. Вызовем внутренний метод Call функции callback с объектом T в качестве значения this и
                    // списком аргументов, содержащим kValue, k и O.
                    callback.call(T, kValue, k, O);
                }
                // d. Увеличим k на 1.
                k++;
            }
        // 8. Вернём undefined.
        };
    }

    const TTBuilder = {
        tableId: '',    // HTML table id
        data: null,     // data
        hiddenCellIndex: -1,
        statusColumnIndex: -1,
        headerDef: '',
        rowStatusTemplateStart: 'background: linear-gradient(to right, rgb(112, 255, 109) 0%, rgb(238, 255, 5) ',
        rowStatusTemplateEnd: '%, rgb(255, 99, 99) 100%);',
        colTypes: [],

        // constructor
        init: function (tableId, data, statusColumn) {
            if (data && typeof data === 'object') {
                if (typeof data.header === 'object' && typeof data.header.length === 'number' &&
                    typeof data.tasks === 'object' && typeof data.tasks.length === 'number') {
                    // this.saveTask = this.saveTask.bind(this);
                    // this.deleteTask = this.deleteTask.bind(this);
                    // this.canselEdit = this.canselEdit.bind(this);
                    this.tableId = tableId;
                    this.data = Object.assign({}, data);

                    // two phases of table building:
                    // 1. build the headerin renderHeader()
                    // 2. build the data rows in external funcion 'renderData'
                    this.renderHeader();
                    this.statusColumnIndex = this.getIndexByColumnId(statusColumn);
                    // now, lets sort data by specified index this.sortColumnIndex and build the rest of table...
                    if (this.sortColumnIndex != -1) {
                        this.sortTasks();
                    }
                    this.renderData();
                }
            }

        },
        /**
         * Finds and returns an index of column by its id in header section of data.
         * In case of index cannot be found, returns -1
         * @param {string} id Column id in header array
         */
        getIndexByColumnId: function(id) {
            const header = this.data.header;
            for (let ci = 0; ci < header.length; ci++) {
                if (header[ci].id === id) {
                    return ci;
                }
            }
            retun -1;
        },
        /**
         * Finds and returns an array of indexes of columns by any specified parameter in header section of data
         * In case of indexes cannot be found, returns an empty array
         * For examle: this.getIndexesByParam('type', 'hidden') returns [5] (as defined in index.html data initialization script)
         * and this.getIndexesByParam('type', 'date') returns [0,4]
         *
         * @param {string} paramName The name of parameter in header array
         * @param {string} paramValue The value of specified by paramName parameter
         */
        getIndexesByParam: function(paramName, paramValue) {
            const header = this.data.header;
            const ids = [];
            for (let ci = 0; ci < header.length; ci++) {
                if (header[ci][paramName] === paramValue) {
                    ids.push(ci);
                }
            }
            return ids;
        },
        /**
         * Appends tasks into the table. The structure of the task must match
         * the structure transferred in the header by the number of columns.
         * @param {object} tasks
         */
        addTasks:  function(tasks) {
            if (typeof tasks === 'object' && typeof tasks.length === 'number') {
                this.data.tasks = this.data.tasks.concat(tasks);
                // now sort tasks and rebuild table!
                this.rebuld();
            }
        },
        /**
         * Sorts tasks in the stored data objects and rebuilds the table.
         * The current sorted column and sorting direction remains untoched
         */
        rebuld: function() {
            this.sortTasks();
            this.renderHeader();
            this.renderData();
        },
        /**
         * Sorts the table after clicking on the column header
         * @param {sting} columnId The column id
         */
        setSort: function(columnId) {
            // find index by UNIQUE column id
            let index = -1;
            const header = this.data.header;
            for (let ci = 0; ci < header.length; ci++) {
                if (header[ci].id === columnId) {
                    if (this.sortColumnIndex == ci) {
                        // reverse sort direction in this case!
                        header[ci].sortDir = header[ci].sortDir ? 0 : 1;
                    }
                    this.sortColumnIndex = ci;
                    index = ci;
                }
                // reset sorting flag for all columns
                header[ci].isSort = 0;
            }
            if (index != -1) {
                // set sorting flag in found column also
                header[this.sortColumnIndex].isSort = 1;
            }
            // now sort tasks and rebuild table!
            this.rebuld();
        },
        /**
         * Rebuild header of table
         */
        renderHeader: function() {
            let rowDef;
            const header = this.data.header;
            this.colTypes = [];

            for (let index = 0; index < header.length; index++) {
                if (index == 0) {
                    this.headerDef = '<tr>' // '<data-row>';
                    rowDef = '';
                }
                const col = header[index];
                if (col.type !== 'hidden') {
                    this.sortColumnIndex = col.isSort ? index : this.sortColumnIndex;
                    const def = '<th id="{0}" class="header" style="text-align: center;" type="string" data-mode="{1}" data-sort-Dir="{2}" data-is-sort="{3}">{4}</th>';
                    rowDef += def.f(col.id, col.mode, col.sortDir, col.isSort, col.name)
                } else {
                    this.hiddenCellIndex = index;
                }
                this.colTypes.push(col.type);
            }
            if (rowDef.length) {
                this.headerDef += rowDef + '</tr>';
            }
        },
        /**
         * Event handler for clicking the "Save" button in the task change form
         * @param {object} evt
         */
        saveTask: function(evt) {
            evt.preventDefault();

            const regex = new RegExp(':', 'g');
            const tStart = parseInt(evt.target.form[0].value.replace(regex, ''), 10);
            const tEnd   = parseInt(evt.target.form[2].value.replace(regex, ''), 10);

            if (isNaN(tStart)) {
                evt.target.form[0].classList.add('error');
                return;
            }
            if (isNaN(tEnd)) {
                evt.target.form[2].classList.add('error');
                return;
            }
            if (tEnd <= tStart) {
                console.log('The start time cannot be greater than end time');
                evt.target.form[0].classList.add('error');
                evt.target.form[2].classList.add('error');
                return;
            }
            const taskIndex = evt.target.form.dataset['taskIndex'];
            const task = window.mmkTTBuilder.data.tasks[taskIndex];

            // Fill the task paarts with data from form
            // Note: The id of the input elements in the form coincides with the id of the corresponding elements
            //  in the header of the table, and differs from it by the presence of the additional word "Edit".
            // By removing this word, we can find the corresponding field in the header, and hence in the array of tasks.
            for (let formIndex = 0; formIndex < 3; formIndex++) {
                let paramIndex = window.mmkTTBuilder.getIndexByColumnId(evt.target.form[formIndex].id.replace('Edit',''));
                task[paramIndex] = evt.target.form[formIndex].value;
            }
            // remove event listeners
            evt.target.form[3].removeEventListener('click', window.mmkTTBuilder.saveTask);
            evt.target.form[4].removeEventListener('click', window.mmkTTBuilder.deleteTask);
            evt.target.form[5].removeEventListener('click', window.mmkTTBuilder.canselEdit);
            // hide form
            evt.target.form.classList.remove('shown');
            // sort and rebuild table
            window.mmkTTBuilder.rebuld();
        },
        /**
         * Event handler for clicking the "Delete" button in the task change form
         * @param {object} evt
         */
        deleteTask: function(evt) {
            evt.preventDefault();
            const taskIndex = evt.target.form.dataset['taskIndex'];
            // remove selected task
            window.mmkTTBuilder.data.tasks.splice(taskIndex, 1);
            // remove event listeners
            evt.target.form[3].removeEventListener('click', window.mmkTTBuilder.saveTask);
            evt.target.form[4].removeEventListener('click', window.mmkTTBuilder.deleteTask);
            evt.target.form[5].removeEventListener('click', window.mmkTTBuilder.canselEdit);
            // hide form
            evt.target.form.classList.remove('shown');
            // sort and rebuild table
            window.mmkTTBuilder.rebuld();
        },
        /**
         * Event handler for clicking the "Cancel" button in the task change form
         * @param {object} evt
         */
        canselEdit: function(evt) {
            evt.preventDefault();
            // remove event listeners
            evt.target.form[3].removeEventListener('click', window.mmkTTBuilder.saveTask);
            evt.target.form[4].removeEventListener('click', window.mmkTTBuilder.deleteTask);
            evt.target.form[5].removeEventListener('click', window.mmkTTBuilder.canselEdit);
            // hide form
            evt.target.form.classList.remove('shown');
        },
        /**
         * Build tasks part of table
         */
        renderData: function() {
            let tableDef = '',
                status,
                rowDef = '';

            const tasks = this.data.tasks;
            for (let index = 0; index < tasks.length; index++) {
                const task = tasks[index];
                if (this.colTypes.length != task.length) {
                    console.error('Attention: the problem in data format! Continue without output');
                    continue;
                }
                const readyStatus = parseInt(task[this.statusColumnIndex], 10);
                if (isEdge() || isIE()) {
                    if (this.statusColumnIndex > -1 && readyStatus > 0) {
                        status = ('{0}{1}{2}').f(this.rowStatusTemplateStart, readyStatus, this.rowStatusTemplateEnd);
                    } else {
                        status = '';
                    }
                    rowDef = ('<tr id="task-{0}" >').f(index);
                } else {
                    if (this.statusColumnIndex > -1 && readyStatus > 0) {
                        status = ('{0}{1}{2}').f(this.rowStatusTemplateStart, readyStatus, this.rowStatusTemplateEnd);
                        rowDef = ('<tr id="task-{0}" style="{1}">').f(index, status);
                    } else {
                        rowDef = ('<tr id="task-{0}" >').f(index);
                    }
                }
                let def;
                for (let ci = 0; ci < task.length; ci++) {
                    if (this.colTypes[ci] !== 'hidden') {
                        def = ('<td type="{0}" style="text-align:{1};">{2}</td>').f(this.colTypes[ci], this.data.header[ci].align, task[ci]);
                        if ((isEdge() || isIE()) && ci == 2) {
                            def = ('<td type="{0}" style="text-align:{1}; {3};">{2}</td>').f(this.colTypes[ci], this.data.header[ci].align, task[ci], status);
                        }
                        rowDef += def;
                    }
                }
                tableDef += rowDef + '</tr>';
            }
            const dataTable = document.getElementById(this.tableId);
            dataTable.innerHTML = '';
            dataTable.innerHTML = this.headerDef + tableDef;
            // the table ir ready, lets add event listeners to header and rows
            const selector = ('#{0} th').f(this.tableId);
            //const hds = document.querySelectorAll(selector);
            [].forEach.call(document.querySelectorAll(selector), function(hd) {
                const mode = hd.dataset['mode'];
                const isSort = Number(hd.dataset['isSort']);
                let sortDir  = Number(hd.dataset['sortDir']);
                let sortSymb = '';

                if (mode === 'sortable') {
                    hd.classList.add('sortable');
                    hd.addEventListener('click', function(evt) {
                        window.mmkTTBuilder.setSort(evt.target.id);
                    });
                    if (isSort) {
                        if (isEdge() || isIE()) {
                            sortSymb = sortDir ? 'sort-up.png' : 'sort-down.png';
                        } else {
                            sortSymb = sortDir ? 'sort-up.svg' : 'sort-down.svg';
                        }
                        hd.innerHTML = ('{0} <img src="{1}" alt="Sorting icon">').f(hd.textContent, sortSymb);                    }
                }
            });

            [].forEach.call(document.querySelectorAll('[id*="task"]'), function(row) {
                if (this.hiddenCellIndex > -1) {
                    // add data attribute to each row
                    const taskIndex = parseInt(row.id.replace('task-', ''), 10);
                    row.dataset[this.data.header[this.hiddenCellIndex].id] = this.data.tasks[taskIndex][this.hiddenCellIndex];
                }
                row.addEventListener('dblclick', function(evt) {
                    const form = document.getElementById('changeTask');
                    // in case of double clicking on another row in table, while the form is opened, lets remove event listeners
                    form[3].removeEventListener('click', window.mmkTTBuilder.saveTask);
                    form[4].removeEventListener('click', window.mmkTTBuilder.deleteTask);
                    form[5].removeEventListener('click', window.mmkTTBuilder.canselEdit);

                    // fill form
                    const taskIndex = parseInt(evt.currentTarget.id.replace('task-', ''), 10);
                    const task = window.mmkTTBuilder.data.tasks[taskIndex];
                    // store selected task index in dataset
                    form.dataset['taskIndex'] = taskIndex;

                    // Fill the form's inputs with data from selected task
                    // Note: The id of the input elements in the form coincides with the id of the corresponding elements
                    //  in the header of the table, and differs from it by the presence of the additional word "Edit".
                    // By removing this word, we can find the corresponding field in the header, and hence in the array of tasks.
                    for (let formIndex = 0; formIndex < 3; formIndex++) {
                        let paramIndex = window.mmkTTBuilder.getIndexByColumnId(form[formIndex].id.replace('Edit',''));
                        form[formIndex].value = task[paramIndex];
                    }
                    // add event listeners on buttons
                    form[3].addEventListener('click', window.mmkTTBuilder.saveTask);
                    form[4].addEventListener('click', window.mmkTTBuilder.deleteTask);
                    form[5].addEventListener('click', window.mmkTTBuilder.canselEdit);

                    // positioning the form just under selected task
                    const taskRect = evt.currentTarget.getBoundingClientRect();
                    form.style.setProperty('left', ('{0}px').f(taskRect.left));
                    form.style.setProperty('top', ('{0}px').f(taskRect.bottom));
                    // reset all prev classes
                    form[0].classList.remove('error');
                    form[2].classList.remove('error');

                    // show the form
                    form.classList.add('shown');
                    // and centering it! (I cannot do this before form is shown!)
                    const formRect = form.getBoundingClientRect();
                    const leftPos = (taskRect.left + taskRect.width / 2) - formRect.width / 2;
                    form.style.setProperty('left', ('{0}px').f(leftPos));
                })
            })
        },
        /**
         * Sorting the table by stored column index
         */
        sortTasks: function() {
            // this.data.tasks - an array of rows
            // this.sortColumnIndex - an index of column in this.data.header array
            const sortColumnIndex = this.sortColumnIndex
            const sortDir = this.data.header[this.sortColumnIndex].sortDir;
            const dataType = this.data.header[this.sortColumnIndex].type;
            let sortResult;

            this.data.tasks.sort(function(a, b) {
                let aColumn = a[sortColumnIndex];
                let bColumn = b[sortColumnIndex];
                let aData, bData;
                switch (dataType) {
                    case 'date': {
                        const regex = new RegExp(':', 'g');
                        aData = parseInt(aColumn.replace(regex, ''), 10);
                        bData = parseInt(bColumn.replace(regex, ''), 10);
                        break;
                    }
                    case 'string': {
                        // not case sencitive comparing
                        aData = aColumn.toUpperCase();
                        bData = bColumn.toUpperCase();
                        break;
                    }
                    case 'number': {
                        aData = parseInt(aColumn, 10);
                        bData = parseInt(bColumn, 10);
                        break;
                    }
                    default:
                        return 0;
                }
                sortResult = aData < bData ? -1 : aData > bData ? 1 : 0;
                if (sortResult) {
                    sortResult = sortDir ? sortResult : -1 * sortResult;
                }
                return sortResult;
            });
        }
    }
    window.mmkTTBuilder = TTBuilder;
})();

