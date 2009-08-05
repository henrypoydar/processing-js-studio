;(function($) {
  
  var flash = null;
  
  var couchapp = null;
  $.CouchApp(function(app) {
    couchapp = app;
  });
  
  var app = new Sammy.Application(function() {
    with(this) {
     
      element_selector = '#main';
      
      var displayFlash = function() {
        if (null == flash) { 
          $('#flash').removeClass().html('').hide();
          return; 
        }
        $('#flash').addClass(flash.css_class).html(flash.message).fadeIn('fast');
        flash = null;
      };
      
      bind('event-context-before', function(e, data) {
        displayFlash();
      });
      
      
      get('#/', function() { 
        this.partial('views/home.html');
      });
      
      get('#/manage', function() {
        $('#main').removeClass('center');
        var ctx = this;
        couchapp.design.view("sketches", {
          include_docs: true,
          success: function(json) {
            console.log(json);  
            ctx.partial('views/manage/index.html', {list: json.rows});
          }
        });
      });
      
      get('#/manage/new', function() {
        $('#main').addClass('center');
        this.partial('views/manage/new.html');
      });
      
      post('#/manage/new', function() {
        var ctx = this;
        var date = new Date();
        var sketch_name = (ctx.params['sketch_name'].blank() ? ('Untitled ' + date) : ctx.params['sketch_name']);
        couchapp.db.saveDoc(
          {
            type: 'sketch',
            created_at: date.toJSON(),
            name: sketch_name,
            code: ctx.params['sketch_code']
          }, {
          success: function(json) {
            flash = { 
              message: "Stored sketch '" + sketch_name + "'",
              css_class: "success"
            };
            ctx.redirect('#/manage');
            return false;
          }
        });
        flash = { 
          message: "There was a problem storing your sketch",
          css_class: "error"
        };
        ctx.redirect('#/manage/new');
      });
      
      get('#/manage/edit/:id', function() {
        $('#main').addClass('center');
        var ctx = this;
        couchapp.db.openDoc(ctx.params["id"], {
          success: function(json) {
            ctx.partial('views/manage/edit.html', {
              item: json, 
              timestamp: couchapp.prettyDate(json.created_at)
            });
          }
        });
      });
      
      put('#/manage/edit/:id', function() {
        var ctx = this;
        var sketch_name = (ctx.params['sketch_name'].blank() ? ('Untitled ' + date) : ctx.params['sketch_name']);
        couchapp.db.openDoc(ctx.params["id"], {
          success: function(json) {
            couchapp.db.saveDoc({
              _id: json._id,
              _rev: json._rev,
              code: ctx.params['sketch_code'],
              name: sketch_name,
              type: json.type,
              updated_at: new Date().toJSON()
              }, {
              success: function(json) {
                //console.log('stored doc: ', json)
                flash = { 
                  message: "Updated sketch '" + sketch_name + "'",
                  css_class: "success"
                };
                ctx.redirect('#/manage');
              }
            });
            return false;
          }
        });
      });
      
      get('#/manage/delete/:id', function() {
        
        var ctx = this;
        
        if (!confirm('Are you sure?')) {
          ctx.redirect('#/manage/edit/' + ctx.params["id"]);
          return false;
        }
        
        
        couchapp.db.openDoc(ctx.params["id"], {
          success: function(json) {
            var sketch_name = json.name;
            couchapp.db.removeDoc(json, {
              success: function() {
                flash = { 
                  message: "Deleted sketch '" + sketch_name + "'",
                  css_class: "success"
                };
                ctx.redirect('#/manage');
              }
            });
            return false;
          }
        });
      });
      
      get('#/renderings', function() {
        var ctx = this;
        couchapp.design.view("renderings", {
          include_docs: true,
          success: function(json) {
            //console.log(json);  
            ctx.partial('views/renderings/index.html', {list: json.rows.reverse()});
          }
        });
      });
      
      get('#/rendering/:id', function() {
        var ctx = this;
        couchapp.db.openDoc(ctx.params["id"], {
          success: function(json) {
            ctx.partial('views/renderings/show.html', {
              item: json, 
              timestamp: couchapp.prettyDate(json.created_at)
            });
          }
        });
      });

      get('#/sketches', function() { 
        this.partial('views/sketches/index.html', {list: APP_DATA.sketch_algorithms});
      });
      
      get('#/sketch/:id', function() {
        var tid = this.params['id'];
        this.partial('views/sketches/show.html', {item: APP_DATA.sketch_algorithms[tid], index: tid}, function(data) {
          $(element_selector).html(data);
          $('canvas#view').load_pde('processing/' + APP_DATA.sketch_algorithms[tid].file);
        });
      });
      
      get('#/sketch/reload/:id', function() {
        this.redirect('#/sketch/' + this.params['id']);
      });
      
      get('#/renderings/save/:sketch_id', function() { 
        
        var ctx = this;
        var tid = ctx.params['sketch_id'];
 
        var thumbnail_canvas = scaleCanvas($('canvas#view')[0],150,120);
        var palette_canvas = scaleCanvas($('canvas#view')[0],15,12);

        couchapp.db.saveDoc(
          {
            type: 'rendering',
            created_at: new Date().toJSON(),
            sketch_algorithm: {
              file: APP_DATA.sketch_algorithms[tid].file,
              name: APP_DATA.sketch_algorithms[tid].name,
              code: $.ajax({ 
                url: ('processing/' + APP_DATA.sketch_algorithms[tid].file),
                async: false
              }).responseText
            },
            "_attachments": {
              "rendering.png": {
                "content_type": "image\/png", "data": encodeCanvas($('canvas#view')[0])
              },
              "thumbnail.png": {
                "content_type": "image\/png", "data": encodeCanvas(thumbnail_canvas)
              },
              "palette.png": {
                "content_type": "image\/png", "data": encodeCanvas(palette_canvas)
              }
            },
            palette: hexPaletteFromCanvas(palette_canvas)
          }, {
          success: function(json) {
            //console.log('stored doc: ', json)
            flash = { 
              message: "Stored a rendering of '" + APP_DATA.sketch_algorithms[tid].name + 
                "' - <a href='#/rendering/" + json.id + "'>view</a>",
              css_class: "success"
            };
            ctx.redirect('#/renderings');
          }
        });
        
      });

      get('#/credits', function() {
        this.partial('views/credits.html', {list: APP_DATA.credits});
        $(element_selector).addClass('left');
      });

    }
  });
  
  $(function() {
    app.addLogger(function(e, data) {
      //console.log([app.toString(), app.namespace, e.cleaned_type, data]);
    });
    app.run('#/');
  });
  
})(jQuery);
