/* eslint-disable */

// // Object assign polifill
// if (typeof Object.assign != 'function') {
//     // Must be writable: true, enumerable: false, configurable: true
//     Object.defineProperty(Object, "assign", {
//         value: function assign(target, varArgs) { // .length of function is 2
//         'use strict';
//         if (target == null) { // TypeError if undefined or null
//             throw new TypeError('Cannot convert undefined or null to object');
//         }

//         var to = Object(target);

//         for (var index = 1; index < arguments.length; index++) {
//             var nextSource = arguments[index];

//             if (nextSource != null) { // Skip over if undefined or null
//             for (var nextKey in nextSource) {
//                 // Avoid bugs when hasOwnProperty is shadowed
//                 if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
//                 to[nextKey] = nextSource[nextKey];
//                 }
//             }
//             }
//         }
//         return to;
//         },
//         writable: true,
//         configurable: true
//     });
// }

class TasksTableBuilder {
    constructor(tableId, data = null, statusColumn) {
        if (data && typeof data === 'object') {
            if (typeof data.header === 'object' && typeof data.header.length === 'number' &&
                typeof data.tasks === 'object' && typeof data.tasks.length === 'number') {

                this._tableId = tableId;
                this._data = Object.assign({}, data);
                this._sortId = -1;
                this._headerDef = '';
                this._rowStatusTemplateStart = 'background: linear-gradient(to right, rgb(112, 255, 109) 0%, rgb(238, 255, 5) ';
                this._rowStatusTemplateEnd = '%, rgb(255, 99, 99) 100%);';

                // two phases of table building:
                // 1. build the headerin renderHeader()
                // 2. build the data rows in external funcion 'renderData'
                this.renderHeader();
                this._statusColumnIndex = this.getIndex(statusColumn);
                // now, lets sort data by specified index this._sortColumnIndex and build the rest of table...
                if (this._sortColumnIndex != -1) {
                    this.sortTasks();
                }
                this.renderData();
            }
        }
    }
    getIndex(id) {
        const header = this._data.header;
        for (let ci = 0; ci < header.length; ci++) {
            if (header[ci].id === id) {
                return ci;
            }
        }
        retun -1;
    }
    getSortById(id) {
        const index = this.getIndex(id);
        if (index && index === this._sortColumnIndex) {
            return this._data.header[index].sortDir;
        }
        return -1;
    }
    addTasks(tasks) {
        if (typeof tasks === 'object' && typeof tasks.length === 'number') {
            this._data.tasks = this._data.tasks.concat(tasks);
            // now sort tasks and rebuild table!
            this.sortTasks();
            this.renderHeader();
            this.renderData();
        }
    }
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
        this.sortTasks();
        this.renderHeader();
        this.renderData();
    }
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
            this._sortColumnIndex = col.isSort ? index : this._sortColumnIndex;
            rowDef += `<data-cell id="${col.id}" class="header" style="text-align: center;"
                        type="string"
                        data-mode="${col.mode}" data-sort-Dir="${col.sortDir}" data-is-sort="${col.isSort}">${col.name}</data-cell>`;
            this._colTypes.push(col.type);
        }
        if (rowDef.length) {
            this._headerDef = rowDef + '</data-row>';
        }
    }
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
                rowDef = `<data-row style="${status}">`;
            } else {
                rowDef = '<data-row>';
            }
            for (let ci = 0; ci < task.length; ci++) {
                
                rowDef += `<data-cell type="${this._colTypes[ci]}" style="text-align:${this._data.header[ci].align};">${task[ci]}</data-cell>`;
            }
            tableDef += rowDef + '</data-row>';
        }
        const dataTable = document.getElementById(this._tableId);
        dataTable.innerHTML = '';
        dataTable.innerHTML = this._headerDef + tableDef;
    }
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
                sortSymb = sortDir ? 'sort-down.svg' : 'sort-up.svg';
                this.view.innerHTML = `${this.view.textContent} <img pointer-events="none" src="${sortSymb}" alt="Sorting icon" width="8" height="8" >`;
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

