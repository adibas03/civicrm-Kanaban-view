(function(angular, $, _) {

  angular.module('angular').config(function($routeProvider) {
      $routeProvider.when('/case-kanban', {
        controller: 'AngularKanbanCtrl',
        templateUrl: '~/angular/KanbanCtrl.html',

        // If you need to look up data when opening the page, list it out
        // under "resolve".
        resolve: {
          myContact: function(crmApi) {
            return crmApi('Contact', 'getsingle', {
              id: 'user_contact_id',
              return: ['first_name', 'last_name']
            });
          }
        }
      });
    }
  );

  // The controller uses *injection*. This default injects a few things:
  //   $scope -- This is the set of variables shared between JS and HTML.
  //   crmApi, crmStatus, crmUiHelp -- These are services provided by civicrm-core.
  //   myContact -- The current contact, defined above in config().
  angular.module('angular').controller('AngularKanbanCtrl', function($scope, crmApi, crmStatus, crmUiHelp, myContact) {
    // The ts() and hs() functions help load strings for this module.
    var ts = $scope.ts = CRM.ts('angular');
    var hs = $scope.hs = crmUiHelp({file: 'CRM/angular/KanbanCtrl'}); // See: templates/CRM/angular/KanbanCtrl.hlp

    $scope.cases = [
        [0,1],
        [1],
        [0,1,2],
        [],
        []
    ];

    $scope.unfetched = true;

    $scope.fetch = function() {
      for (i = 0; i < 5; i++) {
        (function (status) {
          CRM.api3('Case', 'get', {
            "sequential": 1,
            'status_id': (status + 1),
          }).done(function (result) {
            var res = result.values;
            if (typeof(res) == 'undefined')
              res = [];
            $scope.cases[status] = res;
            $scope.fetchDetails(res,status);

            setTimeout(function () {
              if (!$scope.$$phase)
                $scope.$apply();
            }, 50);
          })
        })(i)
      }
      $scope.unfetched = false;
    }

    $scope.fetchDetails = function(slist,s){

        for(l=0;l<slist.length;l++){
          (function(c,i,o){
            var id = c.contact_id[1];
            var id2 = c.client_id[1];

            CRM.api3('Contact', 'get', {
              "sequential": 1,
              'id': id,
            }).done(function (result) {
              var res = result.values;

              if (typeof(res) == 'undefined')
                res = {first_name: '', last_name: ''};
                res = res[0].last_name + ' ' + res[0].first_name;
                $scope.cases[o][i]['contact_name'] = res;

              setTimeout(function () {
                if (!$scope.$$phase)
                  $scope.$apply();
              }, 50);
            });

            CRM.api3('Contact', 'get', {
              "sequential": 1,
              'id': id2,
            }).done(function (result) {
              var res = result.values;
              console.log(res,result)

              if (typeof(res) == 'undefined')
                res = {first_name: '', last_name: ''};
                res = res[0].last_name + ' ' + res[0].first_name;
                $scope.cases[o][i]['owner_name'] = res;

              setTimeout(function () {
                if (!$scope.$$phase)
                  $scope.$apply();
              }, 50);
            });

            CRM.api3('Activity', 'getcount', {
              "sequential": 1,
              'caseID': c.id,
            }).done(function (result) {
              var res = result.result;
              console.log(res,result)

              if (typeof(res) == 'undefined')
                  res = 0;

              $scope.cases[o][i]['activity_count'] = res;

              setTimeout(function () {
                if (!$scope.$$phase)
                  $scope.$apply();
              }, 50);
            });


          })(slist[l],l,s);
      }
    }

    $scope.dropped = function(drag, drop) {
      var tomove = $scope.cases[drag['list-dir']][drag['list-index']];
      $scope.cases[drop['list-dir']].push(tomove);

     // if(typeof($scope.cases[drag['list-dir']] == 'object'))
     // delete($scope.cases[drag['list-dir']][drag['list-index']])
     // else
      if($scope.cases[drag['list-dir']].length>1)
        $scope.cases[drag['list-dir']].splice(drag['list-index'],1);
      else
        $scope.cases[drag['list-dir']] = [];

      if(tomove.id)
          $scope.updateStatus(tomove.id,drop['list-dir']+1);

      setTimeout(function() {
        if (!$scope.$$phase)
          $scope.$apply();
      },100);
      }

    $scope.updateStatus = function(id, status){
      $scope.$apply(
          (function(){
            CRM.api3('Case', 'create', {
              "sequential": 1,
              "id": id,
              "status_id": status
            }).done(function(result) {
              alert(result.is_error?"Failed":"Updated");
              if(result.is_error)
                  $scope.fetch();
            });
          })
      )
    }

    $scope.idUrl = function(id){
      var url = CRM.url('civicrm/case/search', {"force":1,"id":id})
      return url;
    }

    $scope.contactUrl = function(id){
      var url = CRM.url('civicrm/contact/search', {"force":1,"id":id})
      return url;
    }

    $scope.ownerUrl =function(id){
      var url = CRM.url('civicrm/contact/search', {"force":1,"id":id})
      return url;
    }

    $scope.activitiesUrl = function(id){
      var url = CRM.url('civicrm/activity/search', {"force":1,"caseID":id})
      return url;
    }

    $scope.casesUrl =function(id){
      var url = CRM.url('civicrm/case/search', {"force":1,"status_id":id})
      return url;
    }

  });


  //Tooltip directive
  angular.module('angular').directive('tooltip', function ($document, $compile) {
    return {
      restrict: 'A',
      scope: true,
      link: function (scope, element, attrs) {

        var tip = $compile('<div ng-class="tipClass">{{ text }}<div class="tooltip-arrow"></div></div>')(scope),
            tipClassName = 'tooltip',
            tipActiveClassName = 'tooltip-show';

        scope.tipClass = [tipClassName];
        scope.text = attrs.tooltip;

        if(attrs.tooltipPosition) {
          scope.tipClass.push('tooltip-' + attrs.tooltipPosition);
        }
        else {
          scope.tipClass.push('tooltip-down');
        }
        $document.find('body').append(tip);

        element.bind('mouseover', function (e) {
          tip.addClass(tipActiveClassName);

          var pos = e.target.getBoundingClientRect(),
              offset = tip.offset(),
              tipHeight = tip.outerHeight(),
              tipWidth = tip.outerWidth(),
              elWidth = pos.width || pos.right - pos.left,
              elHeight = pos.height || pos.bottom - pos.top,
              tipOffset = 10,
              scrollOffsetY = document.body.scrollTop,
              scrollOffsetX = document.body.scrollLeft;

          if(tip.hasClass('tooltip-right')) {
            offset.top = pos.top + scrollOffsetY - (tipHeight / 2) + (elHeight / 2);
            offset.left = pos.right + scrollOffsetX + tipOffset;
          }
          else if(tip.hasClass('tooltip-left')) {
            offset.top = pos.top + scrollOffsetY - (tipHeight / 2) + (elHeight / 2);
            offset.left = pos.left + scrollOffsetX - tipWidth - tipOffset;
          }
          else if(tip.hasClass('tooltip-down')) {
            offset.top = pos.top + scrollOffsetY + elHeight + tipOffset;
            offset.left = pos.left + scrollOffsetX - (tipWidth / 2) + (elWidth / 2);
          }
          else {
            offset.top = pos.top + scrollOffsetY - tipHeight - tipOffset;
            offset.left = pos.left + scrollOffsetX - (tipWidth / 2) + (elWidth / 2);
          }

          offset = {top:offset.top,left:offset.left};
          tip.offset(offset);

        });

        element.bind('mouseout', function () {
          tip.removeClass(tipActiveClassName);
        });

        tip.bind('mouseover', function () {
          tip.addClass(tipActiveClassName);
        });

        tip.bind('mouseout', function () {
          tip.removeClass(tipActiveClassName);
        });


      }
    }
  });

  //Drag and drop directive
  angular.module('angular').directive('lvlDraggable', ['$rootScope', 'uuid', function($rootScope, uuid) {
    return {
      restrict: 'A',
      link: function(scope, el, attrs, controller) {
        console.log("linking draggable element");

        angular.element(el).attr("draggable", "true");
        var id = attrs.id;
        if (!attrs.id) {
          id = uuid.new()
          angular.element(el).attr("id", id);
        }
        var data = {'list-index':scope.$index,'list-dir':scope.$parent.$index};

        el.bind("dragstart", function(e) {
        e.originalEvent.dataTransfer.setData('text',JSON.stringify(data));
          $rootScope.$emit("LVL-DRAG-START");
        });

        el.bind("dragend", function(e) {
          $rootScope.$emit("LVL-DRAG-END");
        });
      }
    }
  }]);

  angular.module('angular').directive('lvlDropTarget', ['$rootScope', 'uuid', function($rootScope, uuid) {
    return {
      restrict: 'A',
      scope: {
        onDrop: '&'
      },
      link: function(scope, el, attrs, controller) {
        var id = attrs.id;
        if (!attrs.id) {
          id = uuid.new()
          angular.element(el).attr("id", id);
        }

        el.bind("dragover", function(e) {
          if (e.preventDefault) {
            e.preventDefault(); // Necessary. Allows us to drop.
          }

          e.originalEvent.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
          return false;
        });

        el.bind("dragenter", function(e) {
          // this / e.target is the current hover target.
          angular.element(e.target).addClass('lvl-over');
        });

        el.bind("dragleave", function(e) {
          angular.element(e.target).removeClass('lvl-over');  // this / e.target is previous target element.
        });

        el.bind("drop", function(e) {
          if (e.preventDefault) {
            e.preventDefault(); // Necessary. Allows us to drop.
          }

          if (e.stopPropogation) {
            e.stopPropogation(); // Necessary. Allows us to drop.
          }

          var data = e.originalEvent.dataTransfer.getData("text");
          var dest = {'list-dir':scope.$parent.$index};

          scope.onDrop({dragEl: JSON.parse(data), dropEl: dest});
        });

        $rootScope.$on("LVL-DRAG-START", function() {
          var el = document.getElementById(id);
          angular.element(el).addClass("lvl-target");
        });

        $rootScope.$on("LVL-DRAG-END", function() {
          var el = document.getElementById(id);
          angular.element(el).removeClass("lvl-target");
          angular.element(el).removeClass("lvl-over");
        });
      }
    }
  }]);


  //Drag and drop service
  angular.module('angular').factory('uuid', function() {
        var svc = {
          new: function() {
            function _p8(s) {
              var p = (Math.random().toString(16)+"000000000").substr(2,8);
              return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
            }
            return _p8() + _p8(true) + _p8(true) + _p8();
          },

          empty: function() {
            return '00000000-0000-0000-0000-000000000000';
          }
        };

        return svc;
      });

})(angular, CRM.$, CRM._);
