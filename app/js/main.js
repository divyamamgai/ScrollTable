(function (w, d, $, $w, $d, undefined) {
    'use strict';

    /*
    I'm dividing the data into groups (of 25 each). And at a time only 3 such groups at max are displayed.
    This makes the scrolling smooth since less number of DOM elements are involved. Padding is added at the top and
    bottom of the table body to simulate large scrolling effect.
     */

    var defaults = {
        // Each group size.
        groupSize: 25,
        // Path to the JSON file containing data.
        json: ''
    };

    // Cache jQuery DOMs for faster cloning when required.
    var $cache = {
        table: $('<table class="scroll-table-table"><thead class="scroll-table-head"></thead><tbody class="scroll-table-body"></tbody></table>')
    };

    var ScrollTable = function (element, options) {
        this.$element = $(element);
        this.data = [];
        this.cols = [];
        this.rows = [];
        this.$rowCache = undefined;
        this.rowHeight = 0;
        this.$table = undefined;
        this.$tableHead = undefined;
        this.tableHeadHeight = 0;
        this.$tableBody = undefined;
        this.currentDataGroup = 0;
        this.totalDataGroups = 0;
        // Extend an empty object so that the plugins main defaults are not altered.
        this.options = $.extend({}, defaults, options);
        this.applyAttributes();
        this.init();
    };

    /**
     * This function applies the HTML attribute based options to our plugin instance.
     * This makes our plugin more versatile, since it can get inputs via JS or HTML.
     */
    ScrollTable.prototype.applyAttributes = function () {
        /** @type ScrollTable */
        var self = this;
        var $element = self.$element,
            attributes = {};
        for (var option in defaults) {
            if (defaults.hasOwnProperty(option)) {
                // If HTML attribute does not exists we leave it undefined and $.extend will ignore it.
                attributes[option] = $element.data(option) || undefined;
            }
        }
        $.extend(self.options, attributes);
    };

    /**
     * This function is used to retrieve JSON data from the JSON file URL passed as options.
     * @returns {*}
     */
    ScrollTable.prototype.getData = function () {
        /** @type ScrollTable */
        var self = this;
        // Make AJAX GET request to retrieve our data from the JSON file.
        return $.get(self.options.json)
            .fail(function () {
                console.error('Error occurred while fetching data.');
            });
    };

    /**
     * This function is used to process the raw JSON data into plugin usable form.
     * @param data
     */
    ScrollTable.prototype.processData = function (data) {
        /** @type ScrollTable */
        var self = this;
        // Store only the columns. Since each entry in the array is identical we can use only the first
        // entry to get columns.
        self.cols = Object.keys(data[0]);
        // Convert the object to array for faster insertion.
        self.rows = $.map(data, function (item) {
            return [Object.values(item)];
        });
        // Calculate total number of groups for our data set.
        this.totalDataGroups = Math.floor(self.rows.length / self.options.groupSize);
    };

    /**
     * This generates a row cache so that while appending we can clone it very quickly.
     * @returns {*|HTMLElement}
     */
    ScrollTable.prototype.$generateRowCache = function () {
        /** @type ScrollTable */
        var self = this;
        var rowHTML = '<tr><td>' + self.cols.map(String.prototype.valueOf, '').join('</td><td>') + '</td></tr>';
        return $(rowHTML);
    };

    ScrollTable.prototype.$generateHeadRow = function () {
        /** @type ScrollTable */
        var self = this;
        var headRowHTML = '<tr><th>' + self.cols.join('</th><th>') + '</th></tr>';
        return $(headRowHTML);
    };

    ScrollTable.prototype.$generateFilterRow = function () {
        /** @type ScrollTable */
        var self = this;
        var filterRowHTML = '<tr><th>' + self.cols.map(function (col) {
            return '<input class="scroll-table-filter-input" type="text" title="Filter ' + col +
                '" placeholder="Filter ' + col + '" data-column="' + col + '">';
        }).join('</th><th>') + '</th></tr>';
        return $(filterRowHTML);
    };

    /**
     * Generates main table element and appends it to our plugin element.
     */
    ScrollTable.prototype.generateTable = function () {
        /** @type ScrollTable */
        var self = this;
        self.$table = $cache.table.clone();
        var $headRow = self.$generateHeadRow();
        self.$tableHead = $('.scroll-table-head', self.$table)
            .append($headRow)
            .append(self.$generateFilterRow())
            .append('<tr><th colspan="' + self.cols.length + '" class="scroll-table-info">Total: <span class="scroll-table-total">' + self.rows.length + '</span><a class="glyphicon glyphicon-filter scroll-table-clear-filter" title="Clear Filter"></a></th></tr>');
        self.$element.append(self.$table);
        // Compute the row height. Since we have forced each entry to remain in a single column we can use this row
        // to calculate size of the rest.
        self.rowHeight = $headRow.outerHeight();
        self.tableHeadHeight = self.$tableHead.outerHeight();
    };

    /**
     * Generates table body. Appends required number of cached rows to our table.
     */
    ScrollTable.prototype.generateTableBody = function () {
        /** @type ScrollTable */
        var self = this;
        self.$tableBody = $('.scroll-table-body', self.$table).detach();
        self.$rowCache = self.$generateRowCache();
        // We require only three groups, hence number of required rows are calculated accordingly.
        var numberOfRows = self.options.groupSize * 3;
        for (var i = 0; i < numberOfRows; i++) {
            self.$tableBody.append(self.$rowCache.clone());
        }
        self.$table.append(self.$tableBody);
        self.$tableBody.css({
            paddingTop: self.tableHeadHeight + 'px'
        });
    };

    /**
     * This function renders the selected group (out of the cached 3) with the selected data set that is
     * identified by dataGroup index. No new element is appended, only existing data is modified, and this
     * makes it very efficient.
     * @param group
     * @param dataGroup
     */
    ScrollTable.prototype.renderGroup = function (group, dataGroup) {
        /** @type ScrollTable */
        var self = this;
        // Calculate respective start and ends of the dataGroup index and actual group index since both will be
        // different but will be of similar size.
        var startData = dataGroup * self.options.groupSize;
        var endData = startData + self.options.groupSize;
        var rowLength = self.rows.length;
        var start = group * self.options.groupSize;
        var end = start + self.options.groupSize;
        // Select all of the rows in the table.
        var $rows = self.$tableBody.children();
        var row, rowData;
        var columnCount = self.cols.length;
        for (var i = start, j = startData; (i < end) && (j < endData); i++, j++) {
            row = $rows[i];
            // Check if this row comes in the data set.
            if (j < rowLength) {
                rowData = self.rows[j];
                // Modify the data of the row.
                for (var k = 0; k < columnCount; k++) {
                    row.childNodes[k].innerText = rowData[k];
                }
                row.className = 'filled';
            } else {
                // In case row does not have any data we need to hide it.
                row.className = 'empty';
            }
        }
    };

    /**
     * This function renders the specific required groups and sets the padding of the table body accordingly.
     */
    ScrollTable.prototype.render = function () {
        /** @type ScrollTable */
        var self = this;
        var previousDataGroup = self.currentDataGroup - 1;
        var nextDataGroup = self.currentDataGroup + 1;
        var group = 0;
        if (previousDataGroup >= 0) {
            self.renderGroup(group++, previousDataGroup);
            // If there is any previous data, we need to add padding on the top of the table body to simulate scroll.
            self.$tableBody.css({
                paddingTop: (self.rowHeight * previousDataGroup * self.options.groupSize + self.tableHeadHeight) + 'px'
            });
        } else {
            self.$tableBody.css({
                paddingTop: self.tableHeadHeight + 'px'
            });
        }
        self.renderGroup(group++, self.currentDataGroup);
        if (nextDataGroup < self.totalDataGroups) {
            self.renderGroup(group, nextDataGroup);
            // If there is any data ahead, we need to add padding on the bottom of the table body to simulate scroll.
            self.$tableBody.css({
                paddingBottom: (self.rowHeight * ((self.totalDataGroups - nextDataGroup - 1) * self.options.groupSize)) + 'px'
            });
        } else {
            self.$tableBody.css({
                paddingBottom: '0px'
            });
        }
    };

    ScrollTable.prototype.onScroll = function () {
        /** @type ScrollTable */
        var self = $(this).data('ScrollTable');
        var scrollTop = self.$element.scrollTop();
        var previousDataGroup = self.currentDataGroup;
        // Calculate the current data group user is view based on the scroll position.
        self.currentDataGroup = Math.floor(scrollTop / (self.rowHeight * self.options.groupSize));
        // If the user has switched to a different data group, we render our table again, this adds
        // additional efficiency.
        if (previousDataGroup !== self.currentDataGroup) {
            self.render();
        }
        // Force table head to stay at the top.
        self.$tableHead.css({
            top: scrollTop + 'px'
        });
    };

    /**
     * This function resets the table to the top and renders it again.
     */
    ScrollTable.prototype.reset = function () {
        /** @type ScrollTable */
        var self = this;
        // Hide all of the rows initially, required rows will be automatically shown.
        self.$tableBody.children().addClass('empty');
        self.currentDataGroup = 0;
        // Reset the scroll of the table to the top.
        self.$element.scrollTop(0);
        self.render();
    };

    /**
     * This function is used to filter out the data in the table based on a column.
     * @param column
     * @param value
     */
    ScrollTable.prototype.filter = function (column, value) {
        /** @type ScrollTable */
        var self = this;
        if (value.length > 0) {
            value = value.toLowerCase();
            var filteredData = self.data.filter(function (item) {
                // Convert every data to a lower case string and find a match.
                return (item[column] + '').toLowerCase().indexOf(value) !== -1;
            });
            self.processData(filteredData);
            self.reset();
            // Set the total count according to the filtered data.
            $('.scroll-table-total', self.$tableHead).text(self.rows.length);
        }
    };

    // This function is used to clear out the applied filters.
    ScrollTable.prototype.clearFilter = function () {
        /** @type ScrollTable */
        var self = this;
        // Clear the filter inputs.
        $('input', self.$tableHead).val('');
        // Process original data to revert back to the initial state.
        self.processData(self.data);
        self.reset();
    };

    /**
     * Initialize our plugin - fetch data, process it, and render the table.
     */
    ScrollTable.prototype.init = function () {
        /** @type ScrollTable */
        var self = this;
        self.getData().done(function (data) {
            if ($.isArray(data)) {
                self.data = data;
                self.processData(self.data);
                self.generateTable();
                self.generateTableBody();
                self.render();
                self.$element.on('scroll', self.onScroll);
            }
        });
    };

    // Attach our plugin to jQuery
    $.fn.ScrollTable = function (options) {
        return this.each(function () {
            // Check if the plugin is already attached to this element and whether it is an instance of plugin or not.
            if (!($.data(this, 'ScrollTable') instanceof ScrollTable)) {
                $.data(this, 'ScrollTable', new ScrollTable(this, options));
            }
        });
    };

    $(function () {
        // Automatically attach our plugin to elements with the custom attribute defined.
        $('[data-ScrollTable]', d).ScrollTable();
    });

    // Bind events to the dynamic elements.
    $d
        .on('keyup', '.scroll-table-filter-input', function (event) {
            if (event.which === 13) {
                var $this = $(this);
                // Get the ScrollTable instance of the table which filter input is a part of.
                var scrollTable = $this.parent().parent().parent().parent().parent().data('ScrollTable');
                scrollTable.filter($this.data('column'), $this.val());
            }
        })
        .on('click', '.scroll-table-clear-filter', function () {
            // Get the ScrollTable instance of the table which clear filter button is a part of.
            var scrollTable = $(this).parent().parent().parent().parent().parent().data('ScrollTable');
            scrollTable.clearFilter();
        });

})(window, document, jQuery, jQuery(window), jQuery(document));