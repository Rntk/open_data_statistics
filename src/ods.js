class ODStatistics {
    constructor(opts) {
        let cls_reg = new RegExp('^(.*?)__cls$'),
            id_reg = new RegExp('^(.*?)__id$'),
            tpl_reg = new RegExp('^.*?__tpl$'),
            reg_match,
            coo_match;

        for (let name in opts) {
            if (opts.hasOwnProperty(name)) {
                reg_match = name.match(cls_reg);
                if (reg_match) {
                    this['$' + reg_match[1]] = document.querySelectorAll('.' + opts[name]);
                    continue;
                }
                reg_match = name.match(tpl_reg);
                if (reg_match) {
                    this[name] = document.getElementById(opts[name]).innerHTML;
                    continue;
                }
                reg_match = name.match(id_reg);
                if (reg_match) {
                    this['$' + reg_match[1]] = document.getElementById(opts[name]);
                    continue;
                }
                this[name] = opts[name];
            }
        }
        if (!opts.templater && window.Mustache) {
            this.templater = Mustache;
        }
        this._data = [];
        this.disabled = new Set();
        this.anchor = 'stat';
    }
    
    start() {
        var app = this;
        
        this.bindEvents();
        this.buildStatSelect();
        this.processAddressHash();
    }
    
    processAddressHash() {
        let hash = window.location.hash,
            index = 0;
        
        if (hash) {
            let re = new RegExp(`^.*?${this.anchor}([0-9]*)$`);
            let arr = hash.match(re);
            if (arr && arr[1]) {
                index = +arr[1];
            }
        }
        this.$stat_select.selectedIndex = index;
        this.selectChartStat(index);
    }
    
    updateChartData(url) {
        let app = this;
        
        this.api_url = url;
        let promise = this.fetchData(url);
        promise.then(function(data) {
            app.processData();
            app.renderData();
            app.renderLegend();
        });
        return (promise);
    }
    
    buildStatSelect() {
        if (this.api_data) {
            let option;
            for (let i = 0; i < this.api_data.length; i++) {
                option = document.createElement('option');
                option.setAttribute('value', i);
                option.textContent = this.api_data[i].title;
                this.$stat_select.appendChild(option);
            }
        }
    }
    
    get data() {
        return this._data;
    }
    
    set data(new_data) {
        if ('length' in new_data) {
            this._data = new_data;
        }
    }
       
    fetchData(url) {
        let app = this,
            promise;
        
        promise = new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest(),
                query;
                
                xhr.onreadystatechange = () => {
                    let data;
                    
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        if (xhr.status === 200) {
                            try {
                                data = JSON.parse(xhr.responseText);
                            } catch (e) {
                                reject(e);
                            }
                            if (data.data) {
                                resolve(data);
                            } else {
                                reject(data);
                            }
                        } else {
                            reject(new Error('Can`t get data'));
                        }
                    }
                }
                query = {
                    size: 50
                };
                xhr.open('GET', `${app.proxy}?url=${encodeURIComponent(url)}?source=${JSON.stringify(query)}`, true);
                app.showLoading();
                xhr.send();
        });
        promise.then(function(data) {
            app._data = data.data;
            app.hideLoading();
        }).catch(function(data) {
            app.hideLoading();
            app.showError(data);
        });
        return (promise);
    }
    
    bindEvents() {
        var app = this;
        
        this.$legend_block.addEventListener('click', function(e) {
            if (e.target.classList.contains(app.legend_checkbox_class)) {
                app.changeChart([e.target.getAttribute('data-index')]);
            }
        });
        
        this.$stat_select.addEventListener('change', function() {
            app.selectChartStat(this.options[this.selectedIndex].value);
        });
        
        this.$check_all.addEventListener('click', function() {
            app.changeChart([]);
        });
        
        this.$check_all.addEventListener('click', function() {
            let arr = Array.of(app._data.keys());
            app.changeChart(arr);
        });
    }
    
    random(min, max) {
        return (parseInt((Math.random() * (max - min)) + min));
    }
    
    selectChartStat(index) {
        if (this.api_data[index]) {
            this.current_stat_index = index;
            this.updateChartData(this.api_data[index].url);
            window.location.hash = this.anchor + index;
        }
    }
    
    changeChart(indexes) {
        Chart.defaults.global.animation = false;
        if (indexes && indexes.length) {
            if (indexes.length !== this._data.length) {
                for (let i = 0; i < indexes.length; i++) {
                    indexes[i] = +indexes[i];
                    if (this.disabled.has(indexes[i])) {
                        this.disabled.delete(indexes[i]);
                    } else {
                        this.disabled.add(indexes[i]);
                    }
                }
            } else {
                for (let i = 0; i < indexes.length; i++) {
                    this.disabled.add(+indexes[i]);
                }
            }
        } else {
            this.disabled.clear();
        }
        this.renderData();
    }
    
    processData() {
        for (let i = 0; i < this._data.length; i++) {
            this._data[i].color = `rgba(${this.random(10, 220)},${this.random(10, 220)},${this.random(10, 220)},1)`;
        }
        this.disabled.clear();
    }
    
    buildData() {
        let reg = new RegExp('^y([0-9]{4,4})$'),
            years_set = new Set(),
            years_arr = [],
            datasets = [],
            data = this._data,
            year = '',
            last = 0,
            year_key;
            
        if (this._data[0].measureRu) {
            this.units = this._data[0].measureRu;
        } else {
            this.units = '';
        }
        this.chart_data = {};
        for (let i = 0; i < data.length; i++) {
            if (!this.disabled.has(i)) {
                for (let name in data[i]) {
                    year = reg.exec(name);
                    if (year && year[1]) {
                        years_set.add(+year[1]);
                    }
                }
            }
        }
        years_arr = Array.from(years_set);
        years_arr.sort((a, b) => a - b);
        for (let i = 0; i < data.length; i++) {
            if (!this.disabled.has(i)) {
                datasets.push({
                    label: '',
                    fillColor: 'rgba(220,220,220,0)',
                    strokeColor: 'rgba(220,220,220,1)',
                    pointStrokeColor: '#fff',
                    pointHighlightFill: '#fff',
                    pointHighlightStroke: 'rgba(220,220,220,1)',
                    data: []
                });
                last = datasets.length - 1;
                datasets[last].label = data[i].nameRu;
                datasets[last].strokeColor = data[i].color;
                datasets[last].pointColor = data[i].color;
                datasets[last].units = data[i].measureRu;
                for (let j = 0; j < years_arr.length; j++) {
                    year_key = 'y' + years_arr[j];
                    if (data[i][year_key]) {
                        datasets[last].data.push(+data[i][year_key]);
                    } else {
                        datasets[last].data.push(0);
                    }
                }
            }
        }
        this.chart_data.labels = years_arr;
        this.chart_data.datasets = datasets;
    }
    
    renderData() {
        let app = this;
        
        this.buildData();
        if (this.chart && this.chart.destroy) {
            this.chart.destroy();
        }
        Chart.defaults.global.scaleBeginAtZero = true;
        Chart.defaults.global.tooltipTemplate = this.tooltip__tpl;
        Chart.defaults.global.multiTooltipTemplate = this.tooltip__tpl;
        this.chart = new Chart(this.$chart.getContext('2d')).Line(
            this.chart_data,
            {
                legendTemplate: this.legend__tpl
            }
        );
        this.$source_link.setAttribute('href', this.api_data[this.current_stat_index].page);
        this.$source_link.textContent = this.api_data[this.current_stat_index].title;
    }
    
    renderLegend() {
        this.$legend_block.innerHTML = this.chart.generateLegend();
    }
    
    showError(data) {
        console.log(data);
        alert('Какие-то проблемы. Попробуйте позже.');
        //throw new Error('Can`t get data');
    }
    
    showLoading() {
        this.$loading.classList.add(this.loading_visible_class);
    }
    
    hideLoading() {
        this.$loading.remove(this.loading_visible_class);
    }
}