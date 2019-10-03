/*!
 * jQuery Listswap Plugin
 * Author: @berkandirim
 * Licensed under the MIT license
 * https://github.com/berkandirim/jquery-listswap
*/

$(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module depending on jQuery.
        define(['jquery'], factory);
    } else {
        // No AMD. Register plugin with global jQuery object.
        factory(jQuery);
    }
}(function($, window, document, undefined) {
    
    'use strict';

    var pluginName = "listSwap",
        defaults = {
            truncate: false,
            height: null,
            labelAdd: '',
            labelRemove: '',
            visibleAddRemove: {
                add: true,
                remove: true,
            },
            customClass: '',
            srcTitle: {label: 'Lista 1', class: "default"},
            destTitle: {label: 'Lista 2', class: "default"},
            classInputSearch: "",
            labelClass: {
                add: "",
                remove: ""
            },
            buttonClass: {
                iconAdd: "",
                iconRemove: "",
            },
            parametersAjax: null
        },
        prefix = pluginName.toLowerCase(),
        classes = {
            ready: prefix + '-ready',
            wrap: prefix + '-wrap',
            listWrap: prefix + '-list-wrap',
            hidden: prefix + '-hidden',
            list: prefix + '-list',
            selected: prefix + '-selected',
            controls: prefix + '-controls',
            controlsOrden: prefix + '-controls-orden',
            add: prefix + '-add',
            remove: prefix + '-remove',
            // Evento Ordenamiento
            ordenar: prefix + '-ordenar',
            option: prefix + '-option',
            // Evento Busqueda
            search: prefix + '-search',
            searchBox: prefix + '-searchbox',
            truncate: '',
            title: prefix + '-title'
        },
        events = {
            ready: 'ready.' + pluginName,
            click: 'click.' + pluginName,
            select: 'select.' + pluginName
        },
        parent = null,
        instance = 1,
        dataIconos = [
            { "idIcono": "iPuestoDescarga_", dataBtnClick: "puesto-descarga"},
            { "idIcono": "iDrogueria_", dataBtnClick: "nombre-drogueria"},
            { "idIcono": "iCodigoDrogueria_", dataBtnClick: "codigo-drogueria"}
        ];

    function ListSwap(element, options) {
        this.element = element;
        
        this.options = $.extend({}, defaults, options);

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    ListSwap.prototype = {

        init: function() {
            var source = this.element[0],
                destination = this.element[1],
                wrap = prefix + '_' + instance;
            
            if (!source || !destination) {
                console.error('Please provide both a source and a destination');
            }

            this.setLayout(this.element, source, destination, this.options);
            this.bindUIActions(this.element, source, destination, wrap, this.options.parametersAjax);

            instance++;
        },

        setLayout: function(el, src, dest, options) {
            el.wrapAll('<div id="' + prefix + '_' + instance + '" class="' + classes.wrap + ' ' + options.customClass + '">');
            el.addClass(classes.hidden);

            var btnAdd = (options.visibleAddRemove.add == false) ? '': 
            '   <li class="'+classes.add+'">' +
            '       <span class="'+options.labelClass.add+'">' + options.labelAdd + '</span>' +
            '       <i class="'+options.buttonClass.iconAdd+'"></i>' +
            '   </li>';
            var btnRemove = (options.visibleAddRemove.remove == false) ? '': 
            '   <li class="' + classes.remove + '">'+
            '       <i class="'+options.buttonClass.iconRemove+'"></i>' +
            '       <span class="'+options.labelClass.remove+'">'+options.labelRemove+'</span> '+
            '   </li>';

            var lblsInfo = '<li title="Informacion.">'+
                '<label id="totalSeleccionadas">0</label>'+
                '<b class="text-info">&nbsp;- <i class="fa fa-check-square-o"></i></b> | '+
                '<b class="text-success"><i class="fa fa-truck fa-flip-horizontal text-success"></i> - </b>'+
                '<label id="totalAsignadas">...</label>'+
            '</li>';

            // var lblSeleccionadas = '<li data-toggle="tooltip" data-placement="top" title="Total droguerías asignadas.">'+
            //     '<label id="totalSeleccionadas">0</label>'+
            //     '<b class="text-info">&nbsp;- <i class="fa fa-check-square-o"></i> Dr. Seleccionadas</b>'+
            // '</li>';
            
            // var lblTotalAsignadas = '<li data-toggle="tooltip" data-placement="top" title="Total droguerías asignadas.">'+
            // '<b class="text-success"><i class="fa fa-list-alt"></i> Dr. Asignadas - </b>'+
            //     '<label id="totalAsignadas">...</label>'+
            // '</li>';
            $('#' + prefix + '_' + instance).append('' +
                '<div class="' + classes.listWrap + '">' +
                '   <ul id="src_list_' + instance + '" class="' + classes.list + ' ul-sin-asignar" data-instance="' + instance + '"></ul>' +
                '</div>' + 
                '<ul id="' + prefix + '_' + instance + '_controls' + '" class="' + classes.controls + '" data-instance="' + instance + '">' +
                    btnAdd +
                    btnRemove +
                    lblsInfo +
                    // lblSeleccionadas +
                    // lblTotalAsignadas +
                '</ul>' +
                '<div class="' + classes.listWrap + '">' +
                '   <ul id="dest_list_' + instance + '" class="' + classes.list + ' ul-asignados" data-instance="' + instance + '"></ul>' +
                '</div>'
            );
            var srcList = '#src_list_' + instance;
            var destList = '#dest_list_' + instance;

            this.setSearch(src,  $(srcList),  options.classInputSearch);
            this.setSearch(dest, $(destList), options.classInputSearch);
            this.createList(src, $(srcList));
            this.createList(dest, $(destList));
            // Busqueda
            this.searchFilter(srcList);
            this.searchFilter(destList);
            if (options.srcTitle && options.destTitle) {
                this.addTitle($(srcList), options.srcTitle);
                this.addTitle($(destList), options.destTitle);
            }
            if (options.srcTitle && !options.destTitle || !options.srcTitle && options.destTitle) {
                console.error('Please add both srcTitle and destTitle');
            }
        },

        bindUIActions: function(el, src, dest, wrap, parametersAjax) {
            var _this = this,
                $wrap = $('#' + wrap),
                listOption = '.' + classes.option,
                $ordenar = $wrap.find('.' + classes.controlsOrden + ' button'),
                $button = $wrap.find('.' + classes.controls + ' li');
            $wrap.on(events.click, listOption, function(){
                if($(this).data("remover") == "no"){
                    alerts.alertaNotificar({
                        mensaje: "Esta droguería no puede ser removida.",
                        tipo: "info",
                        tiempo: 4800
                    });
                }else{
                    $(this).toggleClass(classes.selected);
                    // Reajustar la cantidad de droguerias Seleccionadas
                    $("#totalSeleccionadas").text($('.ul-sin-asignar .listswap-selected').length);
                }
            });
            $ordenar.on(events.click, function(){
                // Variables control
                var list = $(this).data("btn-list");
                // Columna ordenar
                var btnClick = $(this).data("btn-click");
                // Orden - ASC - DESC
                var orden = $(this).data("orden");
                var tipoOrden = $(this).data("tipo-orden");
                // Cambiar icono ordenamiento elemento seleccionado 
                dataIconos.forEach(element => {
                    if(element.dataBtnClick == btnClick){
                        $(`#${element.idIcono}${list}`).removeClass();
                        $(`#${element.idIcono}${list}`).addClass(`fas fa-sort-${tipoOrden}-${orden}`);
                    }else{
                        $(`#${element.idIcono}${list}`).removeClass();
                        $(`#${element.idIcono}${list}`).addClass("d-none");
                    }
                });
                // Capturar los elementos 
                var items = $("#"+list+(instance-1)+" li");
                // Ornamiento Elementos
                if(tipoOrden == "numeric"){
                    items.sort(function(a, b){
                        return (orden == "up") ? -$(a).data(btnClick) + $(b).data(btnClick) : +$(a).data(btnClick) - $(b).data(btnClick);
                    });
                }else{
                    items.sort(function(a, b){
                        return (orden == "up") ? ($(b).data(btnClick).toLowerCase()).localeCompare($(a).data(btnClick).toLowerCase()) : ($(a).data(btnClick).toLowerCase()).localeCompare($(b).data(btnClick).toLowerCase());
                    });
                }

                if(orden == "up") $(this).data("orden", "down"); else $(this).data("orden", "up");
                // Re asignar Elementos ordenados
                items.appendTo("#"+list+(instance-1));

            });

            $button.on(events.click, function() {
                _this.moveOption(el, src, dest, wrap, this, parametersAjax);
            });
        },

        createList: function(select, list) {
            var _this = this;
            $(select).find('option').each(function() {
                var value = $(this).attr('value');
                var text = $(this).text();
                var classOption  = ($(this).attr("class") != undefined) ? $(this).attr("class") : "";
                // Data - Elemento
                var dataRemover         = ($(this).data("remover") != undefined) ? $(this).data("remover") : "si";
                var dataPuestoDescarga  = $(this).data("puesto-descarga");
                var dataNombreDrogueria = $(this).data("nombre-drogueria");
                var dataCodigoDrogueria = $(this).data("codigo-drogueria");
                var totalCubetas = ($(this).data("total-cubetas") != null && $(this).data("total-cubetas")) ? $(this).data("total-cubetas") : 0;
                if (_this.options.truncate){
                    classes.truncate = ' ' + prefix + '-truncate';
                }

                list.append(
                    $("<li />",
                        {
                            "class": classes.option + classes.truncate + classes.remove + " " + classOption + " p-0",
                            "data-value": value,
                            "data-puesto-descarga": dataPuestoDescarga,
                            "data-nombre-drogueria": dataNombreDrogueria,
                            "data-codigo-drogueria": dataCodigoDrogueria,
                            "data-remover": dataRemover,
                            "html": `
                                <table class="table table-sm table-bordered p-0 m-0">
                                    <tbody>
                                        <tr>
                                            <td width="25%">${dataPuestoDescarga}</td>
                                            <td width="50%">${totalCubetas} <i class="fa fa-cubes text-warning" aria-hidden="true"></i> ${dataNombreDrogueria}</td>
                                            <td width="25%">${dataCodigoDrogueria}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            `
                            // text + '&nbsp;<i class="fa fa-cubes" aria-hidden="true"></i>&nbsp;'+ totalCubetas
                        }
                    )
                        // "html": text + '&nbsp;<i class="fa fa-cubes" aria-hidden="true"></i>&nbsp;'+ totalCubetas
                );
                // list.append('<li class="' + classes.option + classes.truncate + classes.remove + " " + classOption + '" data-value="' + value + '" data-remover="'+ dataRemover +'">' + text + '&nbsp;<i class="fa fa-cubes" aria-hidden="true"></i>&nbsp;'+ totalCubetas + '</li>');
            });
            if (_this.options.height){
                list.css('height', _this.options.height);
            }
            // Reajustar la cantidad de droguerias asignadas
            $("#totalAsignadas").text($('.ul-asignados li').length);
        },

        moveOption: function(el, src, dest, wrap, button, parametersAjax) {
            // return false;
            var dataItemNoRemove = {};
            var currentInstance = $(button).closest('ul').attr('data-instance');
            var from = '#src_list_',
                to = '#dest_list_',
                select = dest;
            if ($(button).hasClass(classes.remove)) {
                to = [from, from = to][0];
                select = src;
            }

            if(parametersAjax != null && $(button).hasClass(classes.remove) == true){
                var idsRemove = [];
                $(from + currentInstance + ' .' + classes.selected).each(function(){
                    idsRemove.push($(this).attr('data-value'));
                });

                if(idsRemove.length > 0){
                    $.ajax({
                        url: parametersAjax.sUrl,
                        data: {idsRemove: idsRemove, dataAjax: parametersAjax.data},
                        type: 'post',
                        beforeSend: function(){
                            $("#loading").show();
                        },
                        success: function(data){
                            if(data.status == 1){
                                $(from + currentInstance + ' .' + classes.selected).each(function(){
                                    var bRemover = data.idsNoRemove.indexOf(parseInt($(this).attr('data-value')));
                                    if(bRemover == -1 || data.idsNoRemove.length == 0){
                                        $(this).remove();
                                        $(to + currentInstance).append($(this).removeClass(classes.selected));
                                        var $option = $('option[value="' + $(this).attr('data-value') + '"]');
                                        $option.remove();
                                        $(select).append($option);
                                    }
                                });
                                alerts.alertaNotificar({
                                    mensaje: data.msg,
                                    tipo: "success",
                                    tiempo: 4800
                                });
                                $("#modal-footer-btn-asignarDroguerias").trigger( "click" );
                            }else{
                                // Agregar un mensaje 
                            }
                            $("#loading").hide();
                        },
                        error: function(error){
                            // Agregar un mensaje 
                        }
                    });
                }
            }else{
                $(from + currentInstance + ' .' + classes.selected).each(function(){
                    // Remover elemento
                    $(this).remove();
                    $(to + currentInstance).append($(this).removeClass(classes.selected));
                    var $option = $('option[value="' + $(this).attr('data-value') + '"]');
                    $option.remove();
                    $(select).append($option);
                });
            }
            // Reajustar la cantidad de droguerias asignadas
            $("#totalAsignadas").text($('.ul-asignados li').length);
            // Reajustar la cantidad de droguerias Seleccionadas
            $("#totalSeleccionadas").text($('.ul-sin-asignar .listswap-selected').length);
        },

        setSearch: function(select, list, inputClass) {
            if ($(select).attr('data-search')) {
                var searchData = '<div class="'+classes.search+'">' +
                    '<input type="text" placeholder="' + $(select).attr('data-search') + '" class="' + classes.searchBox +' '+ inputClass+ '" />' +
                    '<span class="clear"></span>' +
                    '</div>';
                list.parent().prepend(searchData);
            }
        },

        searchFilter: function(selector) {
            var _this = this;
            $(selector).prev('.' + classes.search).find('.' + classes.searchBox).keyup(function() {
                _this.removeSelection(selector);
                var val = $(this).val().toString().toLowerCase();
                $(selector + ' > li').each(function() {
                    var text = $(this).text().toString().toLowerCase();
                    if (text.indexOf(val) !== -1)  $(this).show(); else $(this).hide();
                });
            });
            _this.clearButton(selector);
        },

        removeSelection: function(selector) {
            $(selector + ' li.' + classes.option).each(function() {
                if ($(this).hasClass(classes.selected))
                    $(this).removeClass(classes.selected);
            });
        },

        clearButton: function(selector) {
            $(selector).prev(' .' + classes.search).find(' .clear').click(function() {
                $(selector).prev(' .' + classes.search).find('.' + classes.searchBox).val('');
                $(selector).prev(' .' + classes.search).find('.' + classes.searchBox).focus();
                $(selector + ' > li').each(function() {
                    $(this).show();
                });
            });
        },

        addTitle: function(selector, oTitle) {

            var btnList = (oTitle.class == "info") ? "src_list_" : "dest_list_";
            // data-
            // data-
            // data-
            $(selector).parent().prepend(`
                <div class="row">
                    <div class="col-12">
                        <h3 class="${classes.title}-${oTitle.class}"> ${oTitle.label}</h3>
                    </div>
                    <div class="col-12">
                        <div class="btn-group ${classes.controlsOrden}" role="group" aria-label="First group" style="width:100%">
                            <button type="button" class="${classes.ordenar} btn btn-outline-${oTitle.class}" style="width:25%" data-btn-list="${btnList}" data-btn-click="puesto-descarga" data-orden="down" data-tipo-orden="numeric">
                                Puesto Descarga <i id="iPuestoDescarga_${btnList}" class="fas fa-sort-numeric-up"></i>
                            </button>
                            <button type="button" class="${classes.ordenar} btn btn-outline-${oTitle.class}" style="width:49%" data-btn-list="${btnList}" data-btn-click="nombre-drogueria" data-orden="up" data-tipo-orden="alpha">
                                Droguería <i id="iDrogueria_${btnList}" class="fas fa-sort-alpha-up d-none"></i>
                            </button>
                            <button type="button" class="${classes.ordenar} btn btn-outline-${oTitle.class}" style="width:26%" data-btn-list="${btnList}" data-btn-click="codigo-drogueria" data-orden="up" data-tipo-orden="numeric">
                                Código <i id="iCodigoDrogueria_${btnList}" class="fas fa-sort-numeric-up d-none"></i>
                            </button>
                        </div>
                    </div>
                </div>`);
        }
    };

    $.fn[pluginName] = function(options) {
        if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" + pluginName,
                new ListSwap(this, options));
        }
    };
}));