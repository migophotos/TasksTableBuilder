/* eslint-disable */


class TasksTableBuilder {
    /**
     *
     * @param {string} tableId HTML 'data-table' element's id
     * @param {object} data Data definition object, contains two arrays: header and tasks
     * @param {string} statusColumn column id from array header, that represent the status of task (used for showing gradient color on background)
     */
    constructor(tableId, data = null, statusColumn) {
        if (data && typeof data === 'object') {
            if (typeof data.header === 'object' && typeof data.header.length === 'number' &&
                typeof data.tasks === 'object' && typeof data.tasks.length === 'number') {
                this.saveTask = this.saveTask.bind(this);
                this.deleteTask = this.deleteTask.bind(this);
                this.canselEdit = this.canselEdit.bind(this);
                this._tableId = tableId;
                this._data = Object.assign({}, data);
                this._sortId = -1;
                this._hiddenCellIndex = -1;
                this._statusColumnIndex = -1;
                this._headerDef = '';
                this._rowStatusTemplateStart = 'background: linear-gradient(to right, rgb(112, 255, 109) 0%, rgb(238, 255, 5) ';
                this._rowStatusTemplateEnd = '%, rgb(255, 99, 99) 100%);';

                // two phases of table building:
                // 1. build the headerin renderHeader()
                // 2. build the data rows in external funcion 'renderData'
                this.renderHeader();
                this._statusColumnIndex = this.getIndexByColumnId(statusColumn);
                // now, lets sort data by specified index this._sortColumnIndex and build the rest of table...
                if (this._sortColumnIndex != -1) {
                    this.sortTasks();
                }
                this.renderData();
            }
        }
    }
    /**
     * Finds and returns an index of column by its id in header section of data.
     * In case of index cannot be found, returns -1
     * @param {string} id Column id in header array
     */
    getIndexByColumnId(id) {
        const header = this._data.header;
        for (let ci = 0; ci < header.length; ci++) {
            if (header[ci].id === id) {
                return ci;
            }
        }
        retun -1;
    }
    /**
     * Finds and returns an array of indexes of columns by any specified parameter in header section of data
     * In case of indexes cannot be found, returns an empty array
     * For examle: this.getIndexesByParam('type', 'hidden') returns [5] (as defined in index.html data initialization script)
     * and this.getIndexesByParam('type', 'date') returns [0,4]
     *
     * @param {string} paramName The name of parameter in header array
     * @param {string} paramValue The value of specified by paramName parameter
     */
    getIndexesByParam(paramName, paramValue) {
        const header = this._data.header;
        const ids = [];
        for (let ci = 0; ci < header.length; ci++) {
            if (header[ci][paramName] === paramValue) {
                ids.push(ci);
            }
        }
        return ids;
    }
    /**
     * Appends tasks into the table. The structure of the task must match
     * the structure transferred in the header by the number of columns.
     * @param {object} tasks
     */
    addTasks(tasks) {
        if (typeof tasks === 'object' && typeof tasks.length === 'number') {
            this._data.tasks = this._data.tasks.concat(tasks);
            // now sort tasks and rebuild table!
            this.rebuld();
        }
    }
    /**
     * Sorts tasks in the stored data objects and rebuilds the table.
     * The current sorted column and sorting direction remains untoched
     */
    rebuld() {
        this.sortTasks();
        this.renderHeader();
        this.renderData();
    }
    /**
     * Sorts the table after clicking on the column header
     * @param {sting} columnId The column id
     */
    setSort(columnId) {
        // find index by UNIQUE column id
        let index = -1;
        const header = this._data.header;
        for (let ci = 0; ci < header.length; ci++) {
            if (header[ci].id === columnId) {
                if (this._sortColumnIndex == ci) {
                    // reverse sort direction in this case!
                    header[ci].sortDir = header[ci].sortDir ? 0 : 1;
                }
                this._sortColumnIndex = ci;
                index = ci;
            }
            // reset sorting flag for all columns
            header[ci].isSort = 0;
        }
        if (index != -1) {
            // set sorting flag in found column also
            header[this._sortColumnIndex].isSort = 1;
        }
        // now sort tasks and rebuild table!
        this.rebuld();
    }
    /**
     * Rebuild header of table
     */
    renderHeader() {
        let rowDef;
        const header = this._data.header;
        this._colTypes = [];

        for (let index = 0; index < header.length; index++) {
            if (index == 0) {
                this._headerDef = '<data-row>';
                rowDef = '';
            }
            const col = header[index];
            if (col.type !== 'hidden') {
                this._sortColumnIndex = col.isSort ? index : this._sortColumnIndex;
                rowDef += `<data-cell id="${col.id}" class="header" style="text-align: center;"
                            type="string"
                            data-mode="${col.mode}" data-sort-Dir="${col.sortDir}" data-is-sort="${col.isSort}">${col.name}</data-cell>`;
            } else {
                this._hiddenCellIndex = index;
            }
            this._colTypes.push(col.type);
        }
        if (rowDef.length) {
            this._headerDef = rowDef + '</data-row>';
        }
    }
    /**
     * Event handler for clicking the "Save" button in the task change form
     * @param {object} evt
     */
    saveTask(evt) {
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
        const task = window.mmkTasksTableBuilder._data.tasks[taskIndex];

        // Fill the task paarts with data from form
        // Note: The id of the input elements in the form coincides with the id of the corresponding elements
        //  in the header of the table, and differs from it by the presence of the additional word "Edit".
        // By removing this word, we can find the corresponding field in the header, and hence in the array of tasks.
        for (let formIndex = 0; formIndex < 3; formIndex++) {
            let paramIndex = window.mmkTasksTableBuilder.getIndexByColumnId(evt.target.form[formIndex].id.replace('Edit',''));
            task[paramIndex] = evt.target.form[formIndex].value;
        }
        // remove event listeners
        evt.target.form[3].removeEventListener('click', this.saveTask);
        evt.target.form[4].removeEventListener('click', this.deleteTask);
        evt.target.form[5].removeEventListener('click', this.canselEdit);
        // hide form
        evt.target.form.classList.remove('shown');
        // sort and rebuild table
        window.mmkTasksTableBuilder.rebuld();
    }
    /**
     * Event handler for clicking the "Delete" button in the task change form
     * @param {object} evt
     */
    deleteTask(evt) {
        evt.preventDefault();
        const taskIndex = evt.target.form.dataset['taskIndex'];
        // remove selected task
        window.mmkTasksTableBuilder._data.tasks.splice(taskIndex, 1);
        // remove event listeners
        evt.target.form[3].removeEventListener('click', this.saveTask);
        evt.target.form[4].removeEventListener('click', this.deleteTask);
        evt.target.form[5].removeEventListener('click', this.canselEdit);
        // hide form
        evt.target.form.classList.remove('shown');
        // sort and rebuild table
        window.mmkTasksTableBuilder.rebuld();
    }
    /**
     * Event handler for clicking the "Cancel" button in the task change form
     * @param {object} evt
     */
    canselEdit(evt) {
        evt.preventDefault();
        // remove event listeners
        evt.target.form[3].removeEventListener('click', this.saveTask);
        evt.target.form[4].removeEventListener('click', this.deleteTask);
        evt.target.form[5].removeEventListener('click', this.canselEdit);
        // hide form
        evt.target.form.classList.remove('shown');
    }
    /**
     * Build tasks part of table
     */
    renderData() {
        let tableDef = '',
            status,
            rowDef = '';

        const tasks = this._data.tasks;
        for (let index = 0; index < tasks.length; index++) {
            const task = tasks[index];
            if (this._colTypes.length != task.length) {
                console.error('Attention: the problem in data format! Continue without output');
                continue;
            }
            const readyStatus = parseInt(task[this._statusColumnIndex], 10);
            if (this._statusColumnIndex > -1 && readyStatus > 0) {
                status = `${this._rowStatusTemplateStart}${readyStatus}${this._rowStatusTemplateEnd}`;
                rowDef = `<data-row id="task-${index}" style="${status}">`;
            } else {
                rowDef = `<data-row id="task-${index}" >`;
            }
            for (let ci = 0; ci < task.length; ci++) {
                if (this._colTypes[ci] !== 'hidden') {
                    rowDef += `<data-cell type="${this._colTypes[ci]}" style="text-align:${this._data.header[ci].align};">${task[ci]}</data-cell>`;
                }
            }
            tableDef += rowDef + '</data-row>';
        }
        const dataTable = document.getElementById(this._tableId);
        dataTable.innerHTML = '';
        dataTable.innerHTML = this._headerDef + tableDef;
        const rows = document.querySelectorAll('[id*="task"]');
        rows.forEach((row) => {
            if (this._hiddenCellIndex > -1) {
                // add data attribute to each row
                const taskIndex = parseInt(row.id.replace('task-', ''), 10);
                row.dataset[this._data.header[this._hiddenCellIndex].id] = this._data.tasks[taskIndex][this._hiddenCellIndex];
            }
            row.addEventListener('dblclick', (evt) => {
                console.log(evt.currentTarget.id + ' task uuid=' + evt.currentTarget.dataset['uuid']);
                const form = document.getElementById('changeTask');
                // in case of double clicking on another row in table, while the form is opened, lets remove event listeners
                form[3].removeEventListener('click', this.saveTask);
                form[4].removeEventListener('click', this.deleteTask);
                form[5].removeEventListener('click', this.canselEdit);

                // fill form
                const taskIndex = parseInt(evt.currentTarget.id.replace('task-', ''), 10);
                const task = window.mmkTasksTableBuilder._data.tasks[taskIndex];
                // store selected task index in dataset
                form.dataset['taskIndex'] = taskIndex;

                // Fill the form's inputs with data from selected task
                // Note: The id of the input elements in the form coincides with the id of the corresponding elements
                //  in the header of the table, and differs from it by the presence of the additional word "Edit".
                // By removing this word, we can find the corresponding field in the header, and hence in the array of tasks.
                for (let formIndex = 0; formIndex < 3; formIndex++) {
                    let paramIndex = window.mmkTasksTableBuilder.getIndexByColumnId(form[formIndex].id.replace('Edit',''));
                    form[formIndex].value = task[paramIndex];
                }
                // add event listeners on buttons
                form[3].addEventListener('click', this.saveTask);
                form[4].addEventListener('click', this.deleteTask);
                form[5].addEventListener('click', this.canselEdit);

                // positioning the form just under selected task
                const taskRect = evt.currentTarget.getBoundingClientRect();
                form.style.setProperty('left', `${taskRect.left}px`);
                form.style.setProperty('top', `${taskRect.bottom}px`);
                // reset all prev classes
                form[0].classList.remove('error');
                form[2].classList.remove('error');

                // show the form
                form.classList.add('shown');
                // and centering it! (I cannot do this before form is shown!)
                const formRect = form.getBoundingClientRect();
                const leftPos = (taskRect.left + taskRect.width / 2) - formRect.width / 2;
                form.style.setProperty('left', `${leftPos}px`);
            })
        })
    }
    /**
     * Sorting the table by stored column index
     */
    sortTasks() {
        // this._data.tasks - an array of rows
        // this._sortColumnIndex - an index of column in this._data.header array
        const sortDir = this._data.header[this._sortColumnIndex].sortDir;
        const dataType = this._data.header[this._sortColumnIndex].type;
        let sortResult;

        this._data.tasks.sort((a, b) => {
            let aColumn = a[this._sortColumnIndex];
            let bColumn = b[this._sortColumnIndex];
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

/**
 * The custom table implementation
 * Found on the Internet and adapted by me
 */
// View (MVC View)
class CellView {
    constructor(view) {
        this.view = view;
    }
    render() {};
}

//String View
class CellStringView extends CellView {
    render() {
        // console.info('special rendering', this.view);
        const id = this.view.getAttribute('id');
        const mode = this.view.dataset['mode'];
        const isSort = Number(this.view.dataset['isSort']);
        let sortDir = Number(this.view.dataset['sortDir']);
        let sortSymb = '';

        if (id && mode === 'sortable') {
            this.view.classList.add("sortable");
            // this is a header, need to listen for clicks!
            this.view.addEventListener('click', (evt) => {
                window.mmkTasksTableBuilder.setSort(evt.target.id);
            });
            if (isSort) {
                sortSymb = sortDir ? 'sort-up.svg' : 'sort-down.svg';
                this.view.innerHTML = `${this.view.textContent} <img src="${sortSymb}" alt="Sorting icon" width="8" height="8" >`;
            }
        } else {
            this.view.innerHTML = `${this.view.textContent}`;
        }
    }
}

//Element (MVC controller)
class CellElement extends HTMLElement {
    constructor() {
        super()
        //create cell
        switch (this.getAttribute('type')) {
        case 'string':
            this.view = new CellStringView(this)
            break

        default:
            this.view = new CellView(this)
        }
    }
    connectedCallback() {
        //render cell
        this.view.render()
    }
}
customElements.define('data-cell', CellElement)

