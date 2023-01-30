/*
 * @license
 * angular-modal v0.4.0
 * (c) 2013 Brian Ford http://briantford.com
 * License: MIT
 */

'use strict';

angular.module('btford.modal', []).
factory('btfModal', function ($animate, $timeout, $compile, $rootScope, $controller, $q, $http, $templateCache, $document) {
  return function modalFactory (config) {
    if (!(!config.template ^ !config.templateUrl)) {
      throw new Error('Expected modal to have exacly one of either `template` or `templateUrl`');
    }

    var template      = config.template,
        controller    = config.controller || angular.noop,
        closeOnEscape = (typeof config.closeOnEscape == "undefined") ? true : false,
        afterFocusOn  = config.afterFocusOn,
        controllerAs  = config.controllerAs,
        container     = angular.element(config.container || document.body),
        element       = null,
        html,
        scope;

    if (config.template) {
      var deferred = $q.defer();
      deferred.resolve(config.template);
      html = deferred.promise;
    } else {
      html = $http.get(config.templateUrl, {
        cache: $templateCache
      }).
      then(function (response) {
        return response.data;
      });
    }

    function activate (locals) {
      return html.then(function (html) {
        if (!element) {
          attach(html, locals);
        }
      });
    }

    function attach (html, locals) {
      element = angular.element(html);
      if (element.length === 0) {
        throw new Error('The template contains no elements; you need to wrap text nodes')
      }
      if (closeOnEscape) {
        $document.unbind("keydown").bind("keydown", function (event) {
            if(event.which == 27) {
              // angularize
              $timeout(deactivate);
            }
        });
      }
      $animate.enter(element, container).then(function() {
        // trap focus if jquery.trap is available
        if (element.trap) {
          element.trap();
        }
      });
      scope = $rootScope.$new();
      if (locals) {
        for (var prop in locals) {
          scope[prop] = locals[prop];
        }
      }
      var ctrl = $controller(controller, { $scope: scope });
      if (controllerAs) {
        scope[controllerAs] = ctrl;
      }
      $compile(element)(scope);
    }

    function deactivate () {
      $document.unbind("keydown");
      if (afterFocusOn) {
        jQuery(afterFocusOn).focus();
      }
      return $animate.leave(element).then(function() {
        scope.$destroy();
        element = null;
      });
    }

    function active () {
      return !!element;
    }

    return {
      activate: activate,
      deactivate: deactivate,
      active: active
    };
  };
});
