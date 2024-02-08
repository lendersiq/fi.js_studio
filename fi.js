/*!
  FI.js v1.1.1 (https://fijs.net/)
*/

function $remaining_life_in_months(columns, header_) {
    const $maturity_date = new Date(columns[header_.indexOf('maturity_date')]); 
    const today = new Date();
    const time_difference = $maturity_date.getTime() - today.getTime();
    return Math.max(1, parseInt(time_difference / (1000 * 60 * 60 * 24 * 30)));  
}

function $current_life_in_years(columns, header_) {
    const $origination_date = new Date(columns[header_.indexOf('origination_date')]) ; 
    const today = new Date();
    const time_difference = today.getTime() - $origination_date.getTime();
    const life = parseFloat(time_difference / (1000 * 60 * 60 * 24 * 365));
    return life.toFixed(2);  
}

function $current_life_in_months(columns, header_) {
    const $origination_date = new Date(columns[header_.indexOf('origination_date')]) ; 
    const today = new Date();
    const time_difference = today.getTime() - $origination_date.getTime();
    const life = parseFloat(time_difference / (1000 * 60 * 60 * 24 * 30));
    return life.toFixed(2);  
}

function $estimate_payment(columns, header_) {
    var $principal = parseFloat(columns[header_.indexOf('principal')]);
    var $monthly_rate = parseFloat(columns[header_.indexOf('rate')]) / 12;
    var months = $remaining_life_in_months(columns, header_);
    var payment = $principal * $monthly_rate * (Math.pow(1 + $monthly_rate, months)) / (Math.pow(1 + $monthly_rate, months) - 1);
    return payment;
}
            
function $average_loanPrincipal(columns, header_) {
    var $principal_temp = parseFloat(columns[header_.indexOf('principal')]);
    var $monthly_rate = parseFloat(columns[header_.indexOf('rate')]) / 12;
    var $payment = parseFloat(columns[header_.indexOf('payment')]);
    if ($payment < $principal_temp * $monthly_rate) {
        $payment = $estimate_payment(columns, header_);
    }
    var $months = Math.max(Math.min($remaining_life_in_months(columns, header_), 360), 1);
    var principal_sum = 0;
    var month = 0;
    while (month < $months && $principal_temp > 0) {
        principal_sum += $principal_temp;
        $principal_temp -= $payment - $principal_temp * $monthly_rate;
        month++;
    }
    average_outstanding = parseFloat(principal_sum / $months);
    if (average_outstanding < 0) {
        console.log('warning: average outstanding below zero ', columns, header_);
    }
    return average_outstanding.toFixed(2);
}

//declare main communication data obj
if (document.getElementById('comm_dependents_')) {
    var _communicator = {};
    const comm_dependents = JSON.parse(document.getElementById('comm_dependents_').innerHTML);
    for (const dependent_pipe in comm_dependents) { 
        _communicator[dependent_pipe] = {};
        if (dependent_pipe.charAt(0)  !== '(' || dependent_pipe.charAt(dependent_pipe.length-1)  !== ')' ) { //inclsive doesn't contain dependent groups
            for (const group in comm_dependents[dependent_pipe]) {
                _communicator[dependent_pipe][group] = {};
            }
        }
    }
    _communicator.status = 0;
    console.log('_communicator is declared', _communicator);
}

var $$USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

function $$maskString(str) {
    var shift_string  = document.getElementById('mask_encryption_').innerHTML;
    var encrypted_string = '';
    for (let i = 0; i < str.length; i++) {
        let shiftCode = shift_string.charCodeAt(Math.min(i, shift_string.length-1));
        if (shiftCode >= 48 && shiftCode <= 57) {
            shift = shiftCode - 48;
        } else if (shiftCode >= 65 && shiftCode <= 90) {
            shift = shiftCode - 65;
        } else {
            shift = shiftCode - 97;
        }                 

        let charCode = str.charCodeAt(i);
        if (charCode >= 48 && charCode <= 57) {
            encrypted_string += String.fromCharCode((charCode - 48 + shift) % 26 + 97);
        } else if (charCode >= 65 && charCode <= 90) {
            encrypted_string += String.fromCharCode((charCode - 65 + shift) % 26 + 65);
        } else if (charCode >= 97 && charCode <= 122) {
            // lowercase letters
            encrypted_string += String.fromCharCode((charCode - 97 + shift) % 26 + 97);
        } else {
            // non-alphabetic characters
            encrypted_string += str.charAt(i);
        }
    }
    return encrypted_string;
}

function $$calculate(str) {
    return Function(`'use strict'; return (${str})`)()
}

function $$add_notation(parent_id, dom_id, heading, function_notation) {
    const notation = document.createElement("div");
    notation.classList.add("accordion-item");
    notation.setAttribute("id", dom_id.replace(/ /g,"_"));
    const note_header = document.createElement("h2");
    note_header.classList.add("accordion-header");
    const note_button = document.createElement("button");
    note_button.classList.add("accordion-button", "collapsed");
    note_button.setAttribute("data-bs-toggle", "collapse");
    note_button.setAttribute("data-bs-target", "#" + dom_id.replace(/ /g,"_") + "_" + heading.replace(/[^A-Z0-9]/ig, ""));
    note_button.setAttribute("aria-expanded", "true");
    note_button.setAttribute("aria-controls", dom_id.replace(/ /g,"_") + "_" + heading.replace(/[^A-Z0-9]/ig, ""));
    note_button.innerHTML = heading;
    note_header.appendChild(note_button);
    notation.appendChild(note_header);
    const collapse = document.createElement("div");
    collapse.classList.add("accordion-collapse", "collapse");
    collapse.setAttribute("id", dom_id.replace(/ /g,"_") + "_" + heading.replace(/[^A-Z0-9]/ig, ""));
    const collapse_body = document.createElement("div");
    collapse_body.classList.add("accordion-body", "console-body");
    const codeblock = document.createElement("div");
    codeblock.classList.add("highLite");
    const colors = document.createElement("div");
    colors.classList.add("highLite_colors");
    codeblock.appendChild(colors);
    const editable = document.createElement("div");
    editable.classList.add("highLite_editable");
    editable.setAttribute("data-lang", "js");
    editable.innerHTML = function_notation;
    codeblock.appendChild(editable);
    collapse_body.appendChild(codeblock);
    collapse.appendChild(collapse_body);
    notation.appendChild(collapse);
    editable.contentEditable = true;
    editable.spellcheck = false;
    editable.autocorrect = "off";
    editable.autocapitalize = "off";
    editable.addEventListener("input", () => highLite(editable));
    highLite(editable);
    document.getElementById(parent_id).appendChild(notation);
}

function $$display_table(name, dom_id, heading_array, table_array, ranking_opt=false) { //ranking_opt when true places the rank in column 1 
    let sum = [];
    let id_column = -1;
    let increment_column = -1;
    let table = document.createElement('table'); 
    table.classList.add('table');
    table.setAttribute("id", name.replace(/ /g,"_"));
    heading = document.createElement('thead'); 
    tr = document.createElement('tr'); 
    if (ranking_opt) {
        th = document.createElement('th'); 
        th.innerHTML = '#';
        tr.appendChild(th);
    }
    heading_array.forEach(function(head, h_index) {
        if (head === 'ID') {
            id_column = h_index; 
        }
        if (head === 'total') {
            increment_column = h_index;
        }
        th = document.createElement('th');
        var capitalized = head.charAt(0).toUpperCase() + head.slice(1)
        th.innerHTML = capitalized;
        tr.appendChild(th);
    });
    heading.appendChild(tr);
    table.appendChild(heading);  
    let count = 1;
    table_array.forEach(function(row, r_index) {
        if (row[row.length-1] != 0) { //hack
            tr = document.createElement('tr');
            if (ranking_opt) {
                td = document.createElement('td'); 
                td.innerHTML = count;
                tr.appendChild(td);
                count++;
            }
            for (column = 0; column < row.length; column++) {
                td = document.createElement('td');
                if (column == id_column) {
                    td.id = row[column];
                    td.innerHTML = $$maskString(row[column]);
                } else if ( row[column] !== "" && !isNaN(row[column]) ) {
                    //@.@ if (Math.round(row[column]) != row[column]) {
                    const isFloat = /\d+\.\d+/.test(row[column].toString());
                    if (isFloat && column !== increment_column) {
                        td.innerHTML = $$USDollar.format(row[column]);
                    } else {
                        td.innerHTML = row[column];
                    }
                    if (typeof sum[column] === 'undefined') {
                        sum[column] = parseFloat(row[column]);
                    } else {
                        sum[column] += parseFloat(row[column]);
                    }   
                } else {
                    td.innerHTML = row[column] === 'undefined' ? '' : row[column]; //@_@how doeas undefined or NaN get into row[column] 
                }
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
    });
    tr = document.createElement('tr');
    if (ranking_opt) {
        th = document.createElement('th');
        th.innerHTML = '';
        tr.appendChild(th);
    }
    th = document.createElement('th');
    th.innerHTML = '';
    tr.appendChild(th);
    for (column = 1; column < heading_array.length; column++) {
        th = document.createElement('th');
        if (typeof sum[column] === 'undefined') {
            th.innerHTML = '';
        } else if ( Math.round(sum[column]) != sum[column] ) {
            th.innerHTML = $$USDollar.format(sum[column]);
        } else {
            th.innerHTML = sum[column];
        }
        tr.appendChild(th);
    }
    table.appendChild(tr);
    document.getElementById(dom_id).appendChild(table);
}

function $$process_pipe(arg, pipe_class, columns, header_) {
    var key = arg.replace(/[\|\|']+/g,'');
    if (key.includes('@')) { //if pipe includes a @ search for _class extension vs. if dictionary includes @ search for _dict extension
        key = key.replace('@', '');
        const value = columns[header_.indexOf(key)];

        //legacy const class_ = JSON.parse(document.getElementById(pipe_class + '_' + key + '_class_').innerHTML);
        const relationships_array = JSON.parse(document.getElementById('relationships_').innerHTML); //move this to root
        const relationship_class = relationships_array[pipe_class];  //change to pipe_class
        return relationship_class[key][value];
    } else if (key.includes('#')) { //if pipe includes a # then search for tag 
        //'|#type|' => 'name',
        key = key.replace('#', '');
        const value = columns[header_.indexOf(key)];
        //if (document.getElementById(pipe_class + '_' + key + '_class_')) {
        //const class_ = JSON.parse(document.getElementById(pipe_class + '_' + key + '_class_').innerHTML);
        //const name_ = JSON.parse(document.getElementById(pipe_class + '_' + key + '_name_').innerHTML);
        const tags_array = JSON.parse(document.getElementById('tags_').innerHTML); //move this to root
        const tags_class = tags_array[pipe_class];  //change to pipe_class
        //console.log('tags_class[key][value]', pipe_class, key, value, tags_class, tags_array)
        return tags_class[key][value];
        //is this applicable? : if name relies on class then include reference to class 
        /*
        if ( typeof name_[parseInt(class_[value])] != 'undefined' && isNaN(name_[parseInt(class_[value])]) ) {
            return name_[parseInt(class_[value])];
        } else {
            return name_[value];
        }
    
    //is this else if applicable?
    } else if (document.getElementById(key + '_name_')) {
        const name_ = JSON.parse(document.getElementById(key + '_name_').innerHTML);
        if ( typeof name_[value] != 'undefined' ) {
            return name_[value];
        }
    } */
    } else {
        //console.log('guru process_pipe', columns[header_.indexOf(key)], isNaN(columns[header_.indexOf(key)]), header_)
        return isNaN(columns[header_.indexOf(key)]) ? columns[header_.indexOf(key)] : isNaN(parseFloat(columns[header_.indexOf(key)])) ? columns[header_.indexOf(key)] : parseFloat(columns[header_.indexOf(key)]);
    }
}


function $$process_pipe_legacy(arg, pipe_defn, columns, header_) {
    //console.log('arg', arg, 'pipe_defn', pipe_defn, 'columns', columns, 'header_', header_);
    var key = arg.replace(/[\|\|']+/g,'');
    if (key.includes('@')) {
        key = key.replace('@', '');
        const value = columns[header_.indexOf(key)];
        const class_ = JSON.parse(document.getElementById(pipe_defn + '_' + key + '_class_').innerHTML);
        return parseInt(class_[value]);
    } else if (key.includes('#')) { 
        //'|#type|' => 'name',
        key = key.replace('#', '');
        const value = columns[header_.indexOf(key)];
        if (document.getElementById(pipe_defn + '_' + key + '_class_')) {
            const class_ = JSON.parse(document.getElementById(pipe_defn + '_' + key + '_class_').innerHTML);
            const name_ = JSON.parse(document.getElementById(pipe_defn + '_' + key + '_name_').innerHTML);
            //if name relies on class then include reference to class
            if ( typeof name_[parseInt(class_[value])] != 'undefined' && isNaN(name_[parseInt(class_[value])]) ) {
                return name_[parseInt(class_[value])];
            } else {
                return name_[value];
            }
        } else if (document.getElementById(key + '_name_')) {
            const name_ = JSON.parse(document.getElementById(key + '_name_').innerHTML);
            if ( typeof name_[value] != 'undefined' ) {
                return name_[value];
            }
        }
    } else {
        console.log('guru process_pipe', columns[header_.indexOf(key)], isNaN(columns[header_.indexOf(key)]), header_)
        return isNaN(columns[header_.indexOf(key)]) ? columns[header_.indexOf(key)] : isNaN(parseFloat(columns[header_.indexOf(key)])) ? columns[header_.indexOf(key)] : parseFloat(columns[header_.indexOf(key)]);
    }
}

function $$process_objs(arg, columns, header_) {  //container objects declared onload
    key = arg.replace(/[\[\]']+/g,'')
    if (typeof window['$' + key] === 'function') {  //check if function, if so return result of function
        return window['$' + key](columns, header_)
    } else {  //if not function return value
        //return document.getElementById(key + '_').innerHTML;
        objs_array = JSON.parse(document.getElementById('objects_').innerHTML);
        return objs_array[key];
    }
}

function $$process_dicts(arg) {
    tag_strip = arg.replace(/<\/?{^>}+(>|$)/g, '');
    const args = tag_strip.replace(/[\{\}']+/g,'').split(':');
    const dict_array = JSON.parse(document.getElementById('dictionary_').innerHTML);
    return dict_array[args[0]][args[1]];
}

function $$process_instr(pipe_defn, columns, header_, filtered = false) {
    const instr_array = JSON.parse(document.getElementById('instr_').innerHTML);
    const instr = instr_array[pipe_defn];
    const process_pipes = instr.replace(/\|[\w'@]+\|/ig, key => $$process_pipe(key, pipe_defn, columns, header_));
    const process_objs = process_pipes.replace(/\[\w+\]/ig, key => $$process_objs(key, columns, header_)); 
    const process_dicts = process_objs.replace(/\{[\w':]+\}/ig, key => $$process_dicts(key));
    const result = $$calculate(process_dicts).toFixed(2);
    if (filtered) {
        const $id = String(columns[header_.indexOf('ID')]).trim();
        var incrementor = 1;  
        var dom_id = pipe_defn + '_' + $id + '_';
        while (document.getElementById(dom_id + String(incrementor))) {
            incrementor++;
        }
        dom_id += String(incrementor);
        const parent_id = "portfolio_" + $id.replace(/ /g,"_");
        $$add_notation(parent_id, dom_id, $$USDollar.format(result) + " &#10549; Instructions", instr);
        $$add_notation(parent_id, dom_id, "| Pipes |", process_pipes);
        $$add_notation(parent_id, dom_id, "[ Objects ]", process_objs);
        $$add_notation(parent_id, dom_id, "{ Dictionaries }", process_dicts);
    }
    if (!isNaN(result)) {
        return parseFloat(result);
    } else {
        console.log('guru error: bad result', result, process_dicts);
    }
}

function $$capture_data(pipe_defn, columns, header_, callbackFn) {
                
    function set_value_nested(key) { 
        if (key == '$instr') {
            return callbackFn(pipe_defn, columns, header_);
        } else if (key.match( /\|[\w'@#]+\|/ig ) != null ) {
            var set_value = key.replace(/\|[\w'@#]+\|/ig, ele => $$process_pipe(ele, pipe_defn, columns, header_));
            if (set_value.match( /\[[\w':]+\]/ig ) != null ) {
                return set_value.replace(/\{[\w':]+\}/ig, ele => $$process_dicts(ele));
            } else {
                return set_value;
            }
        } else { //just the name of the key
            return key;
        }
    }
    
    const comm_dependents = JSON.parse(document.getElementById('comm_dependents_').innerHTML);
    for (const dependent_pipe in comm_dependents) {
        if (dependent_pipe === pipe_defn) {
            for (const group in comm_dependents[pipe_defn]) {  
                var dependent_group = comm_dependents[pipe_defn][group];
                //console.log('debug comm groups: ', pipe_defn, dependent_group)
                var id_index = Object.values(dependent_group).findLastIndex((ele) => ele == 'id');
                //console.log('id_index', id_index, Object.keys(dependent_group)[id_index])
                var group_index = set_value_nested(Object.keys(dependent_group)[id_index]);
                //declare group index, if empty
                if (typeof _communicator[pipe_defn][group][group_index] == 'undefined') { //if a new group_index is not found, declare group_index  
                    _communicator[pipe_defn][group][group_index] = {}; 
                }
                for (property in dependent_group) {  //loop properties of each comm group
                    var property_value = set_value_nested(property) === 'undefined' ? 0 : set_value_nested(property);
                    switch (dependent_group[property].replace('*', '')) {
                        case 'sum':
                            _communicator[pipe_defn][group][group_index][property] = _communicator[pipe_defn][group][group_index][property] ? parseFloat(_communicator[pipe_defn][group][group_index][property]) + parseFloat(property_value) : property_value; 
                            break;
                        case 'increment':
                            _communicator[pipe_defn][group][group_index][property] = _communicator[pipe_defn][group][group_index][property] ? _communicator[pipe_defn][group][group_index][property] + 1 : 1;
                            break;
                        //other cases here
                        default:
                            _communicator[pipe_defn][group][group_index][property] = property_value;
                            break;
                    }
                    //debug console.log(property + " : " + dependent_group[property] + " = " + property_value); 
                }
            }
        } else if (dependent_pipe.charAt(0)  === '(' && dependent_pipe.charAt(dependent_pipe.length-1)  === ')' ) {
            var inclusive_group = comm_dependents[dependent_pipe];
            var id_index = Object.values(inclusive_group).findLastIndex((ele) => ele == 'id');
            var group_index = set_value_nested(Object.keys(inclusive_group)[id_index]);
            if (typeof _communicator[dependent_pipe][group_index] == 'undefined') { //if a new group_index is not found, declare group_index  
                _communicator[dependent_pipe][group_index] = {}; 
            }
            for (property in inclusive_group) {  //loop properties of each inclusive groups
                var property_value = set_value_nested(property) === 'undefined' ? 0 : set_value_nested(property);
                switch (inclusive_group[property].replace('*', '')) {
                    case 'sum':
                        _communicator[dependent_pipe][group_index][property] = _communicator[dependent_pipe][group_index][property] ? parseFloat(_communicator[dependent_pipe][group_index][property]) + parseFloat(property_value) : property_value; 
                        break;
                    case 'increment':
                        _communicator[dependent_pipe][group_index][property] = _communicator[dependent_pipe][group_index][property] ? _communicator[dependent_pipe][group_index][property] + 1 : 1;
                        break;
                    //other cases here
                    default:
                        _communicator[dependent_pipe][group_index][property] = property_value;
                        break;
                }
                //debug console.log(property + " : " + inclusive_group[property] + " = " + property_value); 
            }
        }
    }
    return true;
}

function $$identify_pipe(pipe_header) {  //verify pipe header vs field dictionaries returning(identifying) the type of pipe or false if no match can be indentified
    const field_dicts = JSON.parse(document.getElementById('field_dict_').innerHTML);
    for (const id in field_dicts) {
        var dict_header = Object.keys(field_dicts[id]);
        console.log(id, pipe_header)
        const compareHeaders = (a, b) =>
            a.length === b.length &&
            a.every((element, index) => element.trim() === b[index]);
            
        if (compareHeaders(pipe_header, dict_header)) {
            return id;
        }
    }
    console.log ("guru: header does not match the container's pipe dictionaries (pipe header, field dict)", pipe_header, field_dicts);
    return false;
}

function $$sort_table(table_array, sort_column, sort_opt) { //sort options: ascending, descending, or false 
    //console.log('guru: sort_column, table_array', sort_column, table_array )
    if (sort_opt.substring(0, 3).toLowerCase() == 'asc') {
        table_array.sort((a, b) => parseFloat(a[sort_column]) - parseFloat(b[sort_column]));
    } else if (sort_opt.substring(0, 3).toLowerCase() == 'des') { 
        table_array.sort((a, b) => parseFloat(b[sort_column]) - parseFloat(a[sort_column]));
    }
    return table_array;
}

function $$web_communicator(dom_id) {
    const comm_dependents = JSON.parse(document.getElementById('comm_dependents_').innerHTML);
    
    function set_heading_nested(dependent_properties, dependent_pipe, group = '') {  //example loan, loan: {product: 
        var heading_array = [];
        dependent_pipe = dependent_pipe.replace(/[\(\)']+/g,'');
        for (var property in dependent_properties) {
            property = property.charAt(0) === '$' ? dependent_pipe + ' Result' : property.replace(/[\|\|']+/g,'').replace(/[\[\]']+/g,'');
            property = property.charAt(0) === '#' ? group + ' Name' : property;
            heading_array.push(property);
        }
        return heading_array;
    }
    
    function set_table_nested(comm_pointer_) { //convert object to an array
        console.log('comm_pointer', comm_pointer_);
        var t_array = [];
        for (const prop in comm_pointer_) {
            sortable_array = [];
            if (Object.hasOwn(comm_pointer_, prop)) {  
                for (const element in comm_pointer_[prop]) {
                    sortable_array.push(comm_pointer_[prop][element]);
                }
            } else {
                sortable_array.push(comm_pointer_[prop]);
            }
            t_array.push(sortable_array);
        }
        console.log(t_array);
        return t_array;
    }
    
    //if depnendent propery value is followed by *, sort on that property
    //returns the index of the dependent group 
    function set_sort_nested(dependent_group_config_) {
        var index = 0;
        for (const prop in dependent_group_config_) {
            if (dependent_group_config_[prop].charAt(dependent_group_config_[prop].length-1) === '*') {
                return index;
            }
            index++;
        }
        console.log('guru: error missing sort @', dependent_group_config_);
        return 2;
    }
    
    var comm_array = [];
    for (const dependent_pipe in comm_dependents) {
        console.log(dependent_pipe)
        var heading_array = [];
        table_array = [];
        if (dependent_pipe.charAt(0)  === '(' && dependent_pipe.charAt(dependent_pipe.length-1)  === ')' ) {  //inclusive set--across all groups
            heading_array = set_heading_nested(comm_dependents[dependent_pipe], dependent_pipe);
            table_array = set_table_nested(_communicator[dependent_pipe]);
            if (table_array.length > 0) {
                comm_array[dependent_pipe] = $$sort_table(table_array, set_sort_nested(comm_dependents[dependent_pipe]), 'desc');
                $$display_table(dependent_pipe, dom_id, heading_array, comm_array[dependent_pipe], ranking_opt=true);
            }
        } else {  //exclusive set--particular group
            for (var group in comm_dependents[dependent_pipe]) {
                heading_array = set_heading_nested(comm_dependents[dependent_pipe][group], dependent_pipe, group);
                table_array = set_table_nested(_communicator[dependent_pipe][group]);
                if (table_array.length > 0) {
                    comm_array[dependent_pipe] = $$sort_table(table_array, set_sort_nested(comm_dependents[dependent_pipe][group]), 'desc');
                    $$display_table(dependent_pipe + '-' + group, dom_id, heading_array, comm_array[dependent_pipe], ranking_opt=false);
                }
            }
        }
    }
} 

function $$search_data(pipe_defn, columns, header_, filter, callbackFn) { 
    console.log("guru: filter @ search_data", filter);
    var $id = String(columns[header_.indexOf('ID')]).trim();
    if ($id == filter) {
        const portfolio_id = "portfolio_" + $id.replace(/ /g,"_");
        if (!document.getElementById(portfolio_id)) {
            const portfolio = document.createElement("div");
            portfolio.classList.add("accordion-item");
            const portfolio_header = document.createElement("h2");
            portfolio_header.classList.add("accordion-header");
            const portfolio_button = document.createElement("button");
            portfolio_button.classList.add("accordion-button", "collapsed");
            portfolio_button.setAttribute("data-bs-toggle", "collapse");
            portfolio_button.setAttribute("data-bs-target", "#flush-" + portfolio_id);
            portfolio_button.setAttribute("aria-expanded", "true");
            portfolio_button.setAttribute("aria-controls", "flush-" + portfolio_id);
            portfolio_button.innerHTML = "Portfolio: " + $id;
            portfolio_header.appendChild(portfolio_button);
            portfolio.appendChild(portfolio_header);
            const collapse = document.createElement("div");
            collapse.classList.add("accordion-collapse", "collapse");
            collapse.setAttribute("id", "flush-" + portfolio_id);
            const collapse_body = document.createElement("div");
            collapse_body.classList.add("accordion-body");
            collapse_body.setAttribute("id", portfolio_id);
            collapse.appendChild(collapse_body);
            portfolio.appendChild(collapse);
            document.getElementById('notation_accordion').appendChild(portfolio)
        }
        callbackFn(pipe_defn, columns, header_, true)
    }
}

function $$processor(pipe, filter, callbackFn) {
    const CR = pipe.indexOf('\r');
    const LF = pipe.indexOf('\n');
    const header_end = LF > CR ? LF : CR;
    const file_header = pipe.substring(0, header_end).trim();
    const header_array = file_header.split(',');
    const pipe_defn = callbackFn(header_array);
    if (pipe_defn) {
        const field_dict = JSON.parse(document.getElementById('field_dict_').innerHTML);
        const header_ = Object.values(field_dict[pipe_defn]); //values of json are the fixed headers -- keys are vairable based on the inst
        let rows = pipe.split(/\r?\n|\r|\n/g);
        for (i=1; i < rows.length; i++) {
            columns = rows[i].split(',').map(column=>column.trim());
            //there are define communication modes: in v.1 comm_console (editableable console dev space) or comm_web which is report rendered in the webpage
            if (filter) {
                $$search_data(pipe_defn, columns, header_, filter, $$process_instr);
            } else {
                $$capture_data(pipe_defn, columns, header_, $$process_instr);  //callbackFn
            }
        }
    }
}

async function $$readFile(evt) {
    const files = evt.target.files;
    if (!files) return;
    for (var i=0; i < files.length; i++) {
        var result = await files[i].text();
        $$processor(result, String(id_filter.value.trim()), $$identify_pipe);
    }
    return true;
}

function $$read_all(evt) {
    if (document.getElementById("containerSpinner")) {
        document.getElementById("containerSpinner").style.display = "block";
    }
    const promise = $$readFile(evt);
    console.log('guru: monitor promise', promise);
    promise.then(function(result) {
        $$web_communicator('report_div');
        containerModal.hide();
    });
}

document.querySelectorAll(".file-input").forEach(function(file_input) {
    file_input.addEventListener("change", $$read_all)
});

//document.getElementById("container_file").addEventListener("change", $$read_all);
