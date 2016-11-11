(function() {
    "use strict";

    var utils = (function() {
        function _isType(obj, type) {
            return typeof obj === type;
        };

        function _args(args, startIndex) {
            if(args.length === 0) return [];
            var array = [];
            var index = isUndefined(startIndex) ? 0 : startIndex;
            for(var x = index; x < args.length; x++) {
                array.push(args[x]);
            }
            return array;
        };

        function _loop(array, callback) {
            if(array.length === 1) {
                callback(array[0], 0);
                return;
            }
            var index = array.length;
            while(index--) {
                callback(array[index], index);
            }
        };

        function isArray(obj) {
            return Array.isArray(obj);
        }

        function isString(obj) {
            return _isType(obj, "string");
        };

        function isNumber(obj) {
            return _isType(obj, "number");
        };

        function isObject(obj) {
            return _isType(obj, "object");
        };

        function isFunction(obj) {
            return _isType(obj, "function");
        };

        function isDefined(obj) {
            return !isUndefined(obj);
        };

        function isUndefined(obj) {
            return _isType(obj, "undefined");
        };

        function isPresent(obj) {
            if(isUndefined(obj)) return false;
            if(arguments.length === 0) return false;
            var args = _args(arguments, 1);
            var result = true;
            forEach(args, function(item) {
               if(!(item in obj)) result = false;
            });
            return result;
        };

        function bind(context, fn) {
            return function() {
              return fn.apply(context, arguments);
            };
        };

        function forEach(source, iterator) {
            var index = 0
            if(isArray(source)) {
                _loop(source, iterator);
            }
            else if(isObject(source)) {
                _loop(Object.keys(source), function(key) {
                    iterator(source[key], key);
                });
            }
        };

        function members(obj) {
          return Object.keys(obj);
        };

        function extend(dest) {
            var source = arguments.length == 2 ? arguments[1] : [];

            if(isArray(source) && source.length === 0) {
                source = _args(arguments);
            }

            if(isArray(source)) {
                forEach(source, function(obj, index) {
                    forEach(obj, function(value, key) {
                        dest[key] = value;
                    });
                    extend(dest, obj.prototype);
                });
            }
            else if(isObject(source) || isFunction(source)) {
                forEach(source, function(value, key) {
                    dest[key] = value;
                });
                extend(dest, source.prototype);
            }
            return dest;
        };

        function element(selector) {
            return new $Element(selector);
        };

        var utils = {};
        extend(utils, {
            isArray: isArray,
            isString: isString,
            isNumber: isNumber,
            isObject: isObject,
            isFunction: isFunction,
            isDefined: isDefined,
            isUndefined: isUndefined,
            isPresent: isPresent,
            forEach: forEach,
            extend: extend,
            element: element,
            bind: bind,
            members: members
        });
        return utils;
    })();

    var $Element = (function() {
        var el = undefined;
        
        function $Element(selector) {
            el = utils.isString(selector) ? document.querySelectorAll(selector) : selector;
            this.length = el.length;
            _loop(utils.bind(this, function(item, index) {
                this[index] = item;
            }));
        };

        var proto = $Element.prototype;

        proto.toArray = toArray;
        proto.prop = prop;
        proto.attr = attr;
        proto.remove = remove;
        proto.replaceWith = replaceWith;
        proto.children = children;
        proto.clone = clone;
        proto.html = html;

        function html(newHtml) {
            if(utils.isUndefined(newHtml)) {
                var result = undefined;
                if(el.length === 1) {
                    result = el[0].outerHTML;
                }
                else {
                    result = [];
                    _loop(function(item) {
                        result.push(item.outerHTML)
                    });
                }
                return result;
            }
            else {
                _loop(function(item) {
                    item.outerHTML = newHtml;
                });
            }
        };

        function clone(deepClone) {
            var clones = [];
            utils.forEach(el, function(element) {
                clones.push(element.cloneNode(deepClone));
            });
            return new $Element(clones);
        }

        function children() {
            var result = undefined;
            if(el.length === 1) {
                result = el[0].children;
            }
            else {
                result = [];
                _loop(el, function(item) {
                    result.push.apply(result, item.children);
                });
            }
            return result;
        };

        function _loop(iterator) {
            utils.forEach(el, iterator);
        };

        function _retrieve(callback) {
            if(el.length === 1) {
                callback(el[0]);
            }
            else {
                _loop(callback);
            }
        };

        function toArray() {
            var items = [];
            _loop(function(item) {
                items.push(item);
            })
            return items;
        };

        function prop(name, value) {
            if(utils.isUndefined(value)) {
                var result = [];
                _retrieve(function(item) {
                    if(el.length === 1) {
                        result = item[name];
                    }
                    else {
                        result.push(item[name]);
                    }
                });
                return result;
            }
            else {
                _loop(function(item) {
                   item[name] = value;
                });
                return this;
            }
        };

        function attr(name, value) {
            if(utils.isUndefined(value)) {
                var result = [];
                _retrieve(function(item) {
                    if(el.length === 1) {
                        result = item.attributes[name];
                    }
                    else {
                        result.push(item.attributes[name]);
                    }
                });
                return result;
            }
            else {
                _loop(function(item) {
                   item.setAttribute([name], value);
                });
                return this;
            }
        };

        function remove() {
            _loop(function(item) {
               document.removeChild(item);
            });
            el = [];
        };

        function replaceWith(html) {
            this.prop("outerHTML", html);
            return this;
        };

        return $Element;
    })();

    var $EventDriven = (function() {

        var events = {};

        var context = undefined;

        function $EventDriven(ctx) {
            context = ctx;
        };

        var proto = $EventDriven.prototype;

        proto.on = on;

        proto.emit = emit;

        function on(event, callback) {
            var array = undefined;
            if(utils.isUndefined((array = events[event]))) {
                array = events[event] = [];
            }
            if(array.indexOf(callback) !== -1) return;
            array.push(callback);
        };

        function emit(event, args) {
            if(!(event in events)) console.warn("Event '" + event + "' is not registered");
            utils.forEach(events[event], function(callback) {
                callback.call(context, args);
            });
        };

        return $EventDriven;
    })();

    var MVC = (function() {

        var startBracketsExp = /({{)+/g;
        var endBracketsExp = /(}})+/g;

        function MVC(component, params) {

            if(utils.isUndefined(this)) {
              new MVC(component, params);
              return;
            }

            validateComponentName(component);

            validateParams(params);

            var result = initializeView(params);
            this.template = result.element;
            this.element = result.element;

            result = markForInterpolation(this.element, component);
            this.element = result.element;
            this.bindings = result.bindings;

            this.viewId = params.view;

            this.model = initializeModel(params);

            this.controller = initializeController(params);

            this.shadowModel = shadowify(this.model, this);

            this.shadowModel.on("changed", propertyChanged);

            this.interpolate();

            this.controller.call(this.model);

            this.connectEvents();

            return;
        };

        var proto = MVC.prototype;

        proto.interpolate = interpolate;

        proto.connectEvents = connectEvents;

        function newId(componentName) {
            return "MVC_" + componentName + "_" + Date.now();
        };

        function interpolate(model) {
            var text = undefined;
            var objModel = (model||this.model);
            var html = "";
            utils.forEach(this.bindings, function(binding, id) {
                utils.forEach(binding.expressions, function(expression) {
                    html += binding.templateHTML.replace(new RegExp(expression), evalInterpolation(objModel, expression.replace(/{{/g, '').replace(/}}/g, '')));
                });
                document.getElementById(id).outerHTML = html;
                html = "";
            });
        };

        function markForInterpolation(element, componentName) {
            var bindings = {};
            var expressions = undefined;
            var counter = 0;
            utils.forEach(element.children(), function(item) {
                expressions = getInterpolationExpressions(item.outerHTML);
                if(utils.isUndefined(expressions)) return;
                bindings[(item.id = newId(componentName) + "_" + counter++)] = {
                    templateHTML: item.outerHTML,
                    expressions: expressions
                };
            });

            return {
                element: element,
                bindings: bindings
            };
        };

        function evalInterpolation(model, expr) {
            var members = undefined;
            var fnString = "(function(" + (members = Object.keys(model)) + ") { return " + expr + "; })";
            var args = members.map(function(key) {
              return model[key];
            });
            return eval(fnString).apply(undefined, args);
        };

        function getInterpolationExpressions(view) {
            var matches = undefined;
            var match = undefined;

            var regex = new RegExp(/\{{2}.*\}{2}/g);
            while(match = regex.exec(view)) {
              if(!matches) matches = [];
              matches.push(match[0]);
            }
            return matches;
        }

        function connectEvents() {
            
        };

        function validateComponentName(component) {
            if(component === "" || utils.isUndefined(component)) throw "Please specify the name of a MVC component.";

            var el = utils.element('[mvc="' + component + '"]');
            if(el.length > 1) throw "Multiple '" + component + "' detected.";
            if(el.length === 0) throw "No '" + component + "' detected.";
        };

        function validateParams(params) {
            if(utils.isUndefined(params)) throw "Parameters are not supplied.";
            if(!utils.isPresent(params, "model", "view", "controller")) throw "The parameters must have the 'model', 'view', and 'controller' properties present.";

            if(!utils.isObject(params.model) && !utils.isFunction(params.model)) throw "The model property must either be a function or an object.";
            if(!utils.isFunction(params.controller)) throw "The controller property must be a function.";
            if(!utils.isString(params.view)) throw "The view property must be a string.";
        };

        function initializeView(params) {
            var template = undefined;
            var element = undefined;

            if(params.view.length === 0 || params.view.length === 1 || params.view[0] !== "#") {
              throw "The 'view' property must specify the id of the target HTML element. e.g. '#view'";
            }

            var id = params.view;
            try {
                element = utils.element(id);
                if(element.length === 0) throw "Cannot find element with id '" + id + "'.";
                template = element.prop("outerHTML");
            }
            catch(e) {
                throw "Cannot find element with id '" + id + "'.";
            }

            return {
              template: template,
              element: element
            };
        };

        function initializeModel(params) {
            var model = undefined;

            if(utils.isFunction(params.model)) {
                var result = params.model();
                if(util.isUndefined(result) || !util.isObject(result) || result === null) throw "The function assigned to the model property must return an object";
                model = result;
            }
            else {
                model = params.model;
            }

            return model;
        };

        function initializeController(params) {
            return params.controller;
        };

        function shadowify(model, ctx) {
            var shadowModel = new $EventDriven(ctx);
            utils.forEach(model, function(value, key) {
               shadowModel["_" + key] = value;
               Object.defineProperty(model, key, {
                   enumerable: true,
                   configurable: true,
                   get: function() {
                       return shadowModel["_" + key];
                   },
                   set: function (value) {
                       shadowModel["_" + key] = value;
                       shadowModel.emit("changed", { prop: key, value: value });
                   }
               });
            });
            return shadowModel;
        };

        function propertyChanged(data) {
            this.interpolate();
        };

        return MVC;
    })();

    MVC = utils.extend(MVC, utils);

    window.MVC = MVC;
})();
