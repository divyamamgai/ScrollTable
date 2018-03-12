(function (w, d, $, $w, $d, undefined) {
    'use strict';

    var defaults = {
        groupSize: 25,
        json: ''
    };

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
        this.$tableBody = undefined;
        this.currentDataGroup = 0;
        this.totalDataGroups = 0;
        this.options = $.extend({}, defaults, options);
        this.applyAttributes();
        this.init();
    };

    ScrollTable.prototype.applyAttributes = function () {
        /** @type ScrollTable */
        var self = this;
        var $element = self.$element,
            attributes = {};
        for (var option in defaults) {
            if (defaults.hasOwnProperty(option)) {
                attributes[option] = $element.data(option) || undefined;
            }
        }
        $.extend(self.options, attributes);
    };

    ScrollTable.prototype.getData = function () {
        /** @type ScrollTable */
        var self = this;
        return $.get(self.options.json)
            .fail(function () {
                console.error('Error occurred while fetching data.');
            });
    };

    ScrollTable.prototype.processData = function () {
        /** @type ScrollTable */
        var self = this;
        var data = self.data;
        self.cols = Object.keys(data[0]);
        self.rows = $.map(data, function (item) {
            return [Object.values(item)];
        });
        this.totalDataGroups = Math.floor(self.rows.length / self.options.groupSize);
    };

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

    ScrollTable.prototype.generateTable = function () {
        /** @type ScrollTable */
        var self = this;
        self.$table = $cache.table.clone();
        self.$tableBody = $('.scroll-table-body', self.$table);
        self.$rowCache = self.$generateRowCache();
        var numberOfRows = self.options.groupSize * 3;
        for (var i = 0; i < numberOfRows; i++) {
            self.$tableBody.append(self.$rowCache.clone());
        }
        var $headRow = self.$generateHeadRow();
        self.$tableHead = $('.scroll-table-head', self.$table)
            .append($headRow);
        self.$element.append(self.$table);
        self.rowHeight = $headRow.outerHeight();
        self.$tableBody.css({
            paddingTop: self.rowHeight + 'px'
        });
    };

    ScrollTable.prototype.renderGroup = function (group, dataGroup) {
        /** @type ScrollTable */
        var self = this;
        var startData = dataGroup * self.options.groupSize;
        var endData = startData + self.options.groupSize;
        var start = group * self.options.groupSize;
        var end = start + self.options.groupSize;
        var $rows = self.$tableBody.children();
        var row, rowData;
        var columnCount = self.cols.length;
        for (var i = start, j = startData; (i < end) && (j < endData); i++, j++) {
            row = $rows[i];
            rowData = self.rows[j];
            for (var k = 0; k < columnCount; k++) {
                row.childNodes[k].innerText = rowData[k];
            }
        }
    };

    ScrollTable.prototype.render = function () {
        /** @type ScrollTable */
        var self = this;
        var previousDataGroup = self.currentDataGroup - 1;
        var nextDataGroup = self.currentDataGroup + 1;
        var group = 0;
        if (previousDataGroup >= 0) {
            self.renderGroup(group++, previousDataGroup);
            self.$tableBody.css({
                paddingTop: (self.rowHeight * (previousDataGroup * self.options.groupSize + 1)) + 'px'
            });
        }
        self.renderGroup(group++, self.currentDataGroup);
        if (nextDataGroup < self.totalDataGroups) {
            self.renderGroup(group, nextDataGroup);
            self.$tableBody.css({
                paddingBottom: (self.rowHeight * ((self.totalDataGroups - nextDataGroup - 1) * self.options.groupSize)) + 'px'
            });
        }
    };

    ScrollTable.prototype.onScroll = function () {
        /** @type ScrollTable */
        var self = $(this).data('ScrollTable');
        var scrollTop = self.$element.scrollTop();
        var previousDataGroup = self.currentDataGroup;
        self.currentDataGroup = Math.floor(scrollTop / (self.rowHeight * self.options.groupSize));
        if (previousDataGroup !== self.currentDataGroup) {
            self.render();
        }
        self.$tableHead.css({
            top: scrollTop + 'px'
        });
    };

    ScrollTable.prototype.init = function () {
        /** @type ScrollTable */
        var self = this;
        self.getData().done(function (data) {
            if ($.isArray(data)) {
                self.data = data;
                self.processData();
                self.generateTable();
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
        $('#contacts-table', d).ScrollTable();
    });

})(window, document, jQuery, jQuery(window), jQuery(document));