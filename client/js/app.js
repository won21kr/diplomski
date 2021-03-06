var myModule = angular.module('my_app', [
    'ngResource', 'ngRoute', 'ngMessages', 'ngTable',
    'angularModalService', 'ng-fusioncharts',
    'AuthServices', 'StockService'
]);

myModule.config(function ($routeProvider, $locationProvider){
    $locationProvider.html5Mode({enabled:true, requireBase:false});
    $routeProvider.
        when("/", {
            templateUrl: "/index.html", controller:"AppCtrl"
        }).
        when("/login", {
            templateUrl: "/partials/login.html", controller:"LoginCtrl"
        }).
        when("/register", {
            templateUrl: "/partials/register.html", controller:"RegisterCtrl"
        }).
         when("/profile", {
            templateUrl: "/partials/profile.html", controller:"UserProfileCtrl"
        }).
        when("/stock", {
            templateUrl: "/partials/stock.html", controller:"StockCtrl"
        }).
        when("/stock/new", {
            templateUrl: "/partials/stock_edit.html", controller:"StockNewCtrl"
        }).
        when("/stock/edit/:id", {
            templateUrl: "/partials/stock_edit.html", controller:"StockEditCtrl"
        }).
        when("/stock/remove/:id", {
            templateUrl: "/partials/stock.html", controller:"StockRemoveCtrl"
        }).
        when("/stock-category", {
            templateUrl: "/partials/stock_category.html", controller:"StockCategoryCtrl"
        }).
        when("/stock-category/new", {
            templateUrl: "/partials/stock_category_edit.html", controller:"StockCategoryNewCtrl"
        }).
        when("/stock-category/edit/:id", {
            templateUrl: "/partials/stock_category_edit.html", controller:"StockCategoryEditCtrl"
        }).
        when("/stock-category/remove/:id", {
            templateUrl: "/partials/stock_category.html", controller:"StockCategoryRemoveCtrl"
        }).
        when("/stock-market", {
            templateUrl: "/partials/stock_market.html", controller:"StockMarketCtrl"
        }).
        when("/today-transactions", {
            templateUrl: "/partials/stock_transaction.html", controller:"StockTransactionCtrl"
        }).

        otherwise({redirectTo:'/'})
});

myModule.controller('AppCtrl', function ($scope, $rootScope, $location, Auth) {
    $rootScope.logout = function(){
        Auth.logout();
        $location.path("/login");
      };
});

myModule.controller('LoginCtrl', function($scope, $location, Auth) {
    $scope.user = {login: '', password: ''};
    $scope.failed = false;
    $scope.errors = {};
    $scope.login = function() {
        Auth.login($scope.user.login, $scope.user.password)
          .then(function() {
              event.preventDefault();
              $location.path("/");
          }, function(response) {
              angular.forEach(response.data.errors, function(errors, field){
                  // notify form that field is invalid
                  $scope.form[field].$setValidity('server', false);
                  // store the error messages from the server
                  $scope.errors[field] = errors.join(', ');
              });
              $scope.failed = true;
          })
    };
});

myModule.controller('RegisterCtrl', function($scope, $location, Auth) {
    $scope.new_user = {first_name: '',last_name: '', e_mail: '', password: '', login: ''};
    $scope.failed = false;
    $scope.register = function() {
        Auth.register($scope.new_user.first_name, $scope.new_user.last_name, $scope.new_user.e_mail,
         $scope.new_user.password, $scope.new_user.login)
          .then(function() {
              $location.path("/");
          }, function() {
              $scope.failed = true;
          });
    };
});

myModule.controller('UserProfileCtrl', function($scope, $location, Auth) {
    $scope.save = function() {
        var user_data = {
            email: this.user.e_mail, password: this.user.password,
            first_name: this.user.first_name, last_name: this.user.last_name
        };
        Auth.update({id:this.user.id}, user_data, function(response){
            $location.path("/stock");
        });
    };
});

myModule.controller('StockCtrl', function ($scope, $rootScope, $location, Stock) {
    /*Get All Stock Data*/
    Stock.getNewStockData().$promise.then(function(data){
        $scope.stocks = Stock.StockData.Stock;
        $scope.categories = Stock.StockData.StockCategory;
    });
});

myModule.controller('StockNewCtrl', function ($scope, $location, Stock) {
    $scope.stock = {code: '',name: '', category: {}};
    Stock.category_resource.get().$promise.then(function(data){
        $scope.stock_categories = data.StockCategory;
    });
    $scope.resource = Stock.resource;
    $scope.save = function() {
        var s = this.stock;
        this.resource.save({code: s.code, name: s.name, category: s.category}, function(response) {
            $location.path("/stock");
        });
    }
});

myModule.controller('StockEditCtrl', function ($scope, $location, $routeParams, Stock) {
    $scope.stock = Stock.StockData.Stock[$routeParams.id];
    $scope.stock_id = $routeParams.id;
    $scope.resource = Stock.resource;
    // Charts
    $scope.dataSource = {
        "chart": {
            "caption": "This Year overview",
            "numberprefix": "$",
            "plotgradientcolor": "",
            "bgcolor": "FFFFFF",
            "showalternatehgridcolor": "0",
            "divlinecolor": "CCCCCC",
            "showvalues": "0",
            "showcanvasborder": "0",
            "canvasborderalpha": "0",
            "canvasbordercolor": "CCCCCC",
            "canvasborderthickness": "1",
            "yaxismaxvalue": "30000",
            "captionpadding": "30",
            "linethickness": "3",
            "yaxisvaluespadding": "15",
            "legendshadow": "0",
            "legendborderalpha": "0",
            "palettecolors": "#f8bd19,#008ee4,#33bdda,#e44a00,#6baa01,#583e78",
            "showborder": "0"
        }
    };
    /*Fetch from backend  graph data*/
    $scope.resource.chart_history_lines({id: $scope.stock.id}, function(response) {
            $scope.dataSource.data = response.GroupedData;
            $scope.dataSource.chart.yaxismaxvalue = response.maxYaxis;
        });

    var current_date = new Date();
    current_date.setDate(current_date.getDate() - 7);
    $scope.date_from = current_date;
    $scope.date_to = new Date();

    if (! $scope.stock){
        Stock.resource.get({id: $routeParams.id}, function(response){
            $scope.stock = response.Stock[$scope.stock_id];
            $scope.history_lines = _.filter(response.StockHistory, function(sh) {return $scope.stock.history_lines.indexOf(sh.id) > -1 })
        });
    }
    else {
        $scope.history_lines = _.filter(Stock.StockData.StockHistory, function(sh) {return $scope.stock.history_lines.indexOf(sh.id) > -1 })
        Stock.category_resource.get().$promise.then(function(data){
            $scope.stock_categories = data.StockCategory;
        });
    }
    $scope.save = function() {
        var s = this.stock;
        this.resource.update({id: s.id}, {code: s.code, name: s.name, category: s.category}, function(response) {
            $location.path("/stock");
        });
    }
    $scope.populate_lines = function() {
        var s = this.stock;
        this.resource.populate_lines({id: s.id, date_from: this.date_from, date_to: this.date_to}, function(response) {
            $scope.history_lines = _.map(response.StockHistory, function(hl){return hl});
            /*Reinitialize chart history for new data*/
            $scope.resource.chart_history_lines({id: $scope.stock.id}, function(response) {
            $scope.dataSource.data = response.GroupedData;
            $scope.dataSource.chart.yaxismaxvalue = response.maxYaxis;
        });
        });
    }
});

myModule.controller('StockRemoveCtrl', function ($scope, $location, $routeParams, Stock) {
    Stock.resource.remove({id: $routeParams.id}, function(response) {
            $location.path("/stock");

    });
});

myModule.controller('StockCategoryCtrl', function ($scope, $rootScope, $location, Stock) {
    /*Get All Stock Category Data*/
    Stock.getStockCategoryData().$promise.then(function(data){
        $scope.categories = Stock.StockData.StockCategory;
    });
});

myModule.controller('StockCategoryNewCtrl', function ($scope, $location, Stock) {
    $scope.stock_category = {code: '',name: '', stocks: {}};
    $scope.resource = Stock.category_resource;
    $scope.save = function() {
        var s = this.stock_category;
        this.resource.save({code: s.code, name: s.name}, function(response) {
            $location.path("/stock-category");
        });
    }
});

myModule.controller('StockCategoryEditCtrl', function ($scope, $location, $routeParams, Stock) {
    $scope.stock_category = Stock.StockData.StockCategory[$routeParams.id];
    $scope.stocks = _.filter(Stock.StockData.Stock, function(stock) {return $scope.stock_category.stocks.indexOf(stock.id) > -1 })
    $scope.resource = Stock.category_resource;
    $scope.save = function() {
        var c = this.stock_category;
        this.resource.update({id: c.id}, {code: c.code, name: c.name}, function(response) {
            $location.path("/stock-category");
        });
    };
    $scope.redirect = function() {
        var path = "/stock/edit/" + this.stock.id;
        $location.path(path);
    }
});

myModule.controller('StockCategoryRemoveCtrl', function ($scope, $location, $routeParams, Stock) {
    Stock.category_resource.remove({id: $routeParams.id}, function(response) {
            Stock.getNewStockData().$promise.then(function(data){
                $scope.stocks = Stock.StockData.Stock;
                $scope.categories = Stock.StockData.StockCategory;
                $location.path("/stock-category");
            });

    });
});

myModule.controller('StockTransactionController', function($scope, line, close, Stock){
    $scope.line = line;
    $scope.qty = 1;
    $scope.transaction_resource = Stock.transaction_resource;
    $scope.close = function(result) {
 	    close(result, 500); // close, but give 500ms for bootstrap to animate
    };
    $scope.sell = function(result) {
        var transaction = {stock: this.line.stock.id, user_id: this.user.id, qty: this.qty * (-1),
                           price: this.line.current_price
                           };
        this.transaction_resource.save(transaction);
 	    close(result, 500); // close, but give 500ms for bootstrap to animate
    };

    $scope.buy = function(result) {
        var transaction = {stock: this.line.stock.id, user_id: this.user.id, qty: this.qty,
                           price: this.line.current_price
                           };
        this.transaction_resource.save(transaction);
 	    close(result, 500); // close, but give 500ms for bootstrap to animate
    };
    
});

myModule.controller('StockMarketCtrl', function ($scope, ModalService, $route, NgTableParams, $rootScope, $location, Stock) {
    /*Get All Stock Market Data*/
    var user_id = $scope.user.id;
    $scope.transaction_resource = Stock.transaction_resource;
    $scope.market_resource = Stock.market_resource;
    Stock.user_resource.stock_portfolio({id: user_id}, function(response){
        $scope.user_portfolio = response.User.portfolio;
    });

    $scope.redirect = function() {
        var path = "/stock/edit/" + this.row.stock.id;
        $location.path(path);
    };

    $scope.show_modal = function(transaction_type) {
        var template_name = '';
        if (transaction_type == 'sell'){
            template_name = '/partials/stock_sell_modal.html'
        }
        else if (transaction_type == 'buy') {
            template_name = '/partials/stock_buy_modal.html'
        }
        ModalService.showModal({
              templateUrl: template_name,
              controller: "StockTransactionController",
              inputs:{line: this.row},
            }).then(function(modal) {
              modal.element.modal();
              modal.close.then(function(result) {
                $route.reload();
              });
            });
    };

    $scope.tableParams = new NgTableParams({
      page: 1, // show first page
      count: 10 // count per page
    }, {
      filterDelay: 300,
      getData: function(params) {
        return $scope.market_resource.query(params.url()).$promise.then(function(data){
            return data;
        });
      }
    });

});

myModule.controller('StockCurrentTransactionCtrl', function ($scope, ModalService, $route, NgTableParams, $rootScope, $location, Stock) {
    /*Get All Stock Market Data*/
    var user_id = $scope.user.id;
    $scope.transaction_resource = Stock.transaction_resource;
    $scope.market_resource = Stock.market_resource;
    Stock.user_resource.stock_portfolio({id: user_id}, function(response){
        $scope.user_portfolio = response.User.portfolio;
    });

    $scope.redirect = function() {
        var path = "/stock/edit/" + this.line.stock.id;
        $location.path(path);
    };

    $scope.show_modal = function(transaction_type) {
        var template_name = '';
        if (transaction_type == 'sell'){
            template_name = '/partials/stock_sell_modal.html'
        }
        else if (transaction_type == 'buy') {
            template_name = '/partials/stock_buy_modal.html'
        }
        ModalService.showModal({
              templateUrl: template_name,
              controller: "StockTransactionController",
              inputs:{line: this.row},
            }).then(function(modal) {
              modal.element.modal();
              modal.close.then(function(result) {
                $route.reload();
              });
            });
    };

    $scope.tableParams = new NgTableParams({
      page: 1, // show first page
      count: 10 // count per page
    }, {
      filterDelay: 300,
      getData: function(params) {
        return $scope.market_resource.query(params.url()).$promise.then(function(data){
            return data;
        });
      }
    });

});

myModule.controller('StockTransactionCtrl', function ($scope, $rootScope, $location, Stock) {
    /*Get All Stock Data*/
    Stock.transaction_resource.user_transactions({user_id: $scope.user.id}, function(response){
        $scope.stocks = response.Stock;
        $scope.transactions = response.StockTransaction;
    });
});

myModule.run(['$rootScope', '$location', 'Auth', 'Stock', function ($rootScope, $location, Auth, Stock) {
    Auth.init();
    $rootScope.$on('$routeChangeStart', function (event, next) {
        if (!Auth.isLoggedIn()){
            if (next.templateUrl === '/partials/login.html' || next.templateUrl === '/partials/register.html') {
            }
            else {
                event.preventDefault();
                $location.path("/login");
            }
        }
    });
  }]);