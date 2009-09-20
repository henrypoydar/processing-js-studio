$(document).ready(function() {  

  // TODO: Refactto logic back within Sammy context

  $(".splitter").splitter({sizeLeft: 200});
  
  $(".main_splitter").livequery(function() {
    $(this).splitter({sizeRight: 150});
    $('.info').show(); // Hiding this at first prevents FOUC
  });

  $('li.button:not(.no_toggle)').live('click', function() {
    $(this).toggleClass('depressed');
  });

  $('#flash').click(function() { $(this).fadeOut('fast'); });
  $('a.toggle_grid').live("click", function() { $('.overlay').toggleClass('grid'); });
  $('a.toggle_palette').live("click", function() { $('ul.palette').toggle(); });
  $('a.toggle_source').live("click", function() { $('.source_code').toggle(); });
  
  $('a.preview_sketch').live("click", function() {
   
    $('canvas.preview').each(function() {
      if ($(this).is(":hidden")) {
        Processing(this, $('textarea.source').val());
        $(this).show();
        $('form#sketch_form').hide();
      } else {
        $(this).hide();
        $('form#sketch_form').show();
      }
    });  
  });
  
  $('a.submit_sketch_form').live("click", function() {
    $('form#sketch_form').submit();
  });
  
  // Expandable menu
  $('#nav').each(function() {
    var counter = 0
    $(this).find('ul.expandable').each(function(){
      var cookie_name = 'ul-nav-' + counter;
      var handle = $(this).closest('div').find('h3');
      var expandable = $(this);
      if ($.cookie(cookie_name) == 'show') {
        expandable.show();
        handle.addClass('expanded');
      } else {
        expandable.hide();
        handle.removeClass('expanded');
      }
      handle.click(function(){
        if (expandable.is(":hidden")) {
          $.cookie(cookie_name, 'show');
        } else {
          $.cookie(cookie_name, 'hide');
        }
        expandable.toggle('fast');
        handle.toggleClass('expanded');
      });
      counter += 1;
    });
  });
  
  
  $('a#add_image').live("click", function() { 
    
    var doc_rev = $("input#document_rev_id").val();
    var doc_id = $("input#document_id").val();
   
    $.showDialog("views/dialog/_upload_attachment.html", {
      load: function(elem) {
        $("input[name='_rev']", elem).val(doc_rev);
      },
        submit: function(data, callback) {
        if (!data._attachments || data._attachments.length == 0) {
         callback({_attachments: "Please select a file to upload."});
         return;
        } 
        var form = $("#upload-form");
        form.find("#progress").css("visibility", "visible");
        form.ajaxSubmit({
          url: couchapp.db.uri + encodeDocId(doc_id),
          success: function(resp) {
           
            //console.log(resp);
           
            resp = JSON.parse($(resp).html());
            var attachment_name = data._attachments;
           
            form.find("#progress").css("visibility", "hidden");
            var dialog = $('#dialog');
            dialog.fadeOut("fast", function() {
              $("#dialog, #overlay, #overlay-frame").remove();
            });
           
            $("input#document_rev_id").val(resp.rev);
           
            $('.hidden_vars').append("<img src='../../" + doc_id + "/" + attachment_name + "' class ='" + attachment_name.cssify() + "' id='" + attachment_name + "' />");
           
            $('ul.sketch_images').append("<li class='" + attachment_name.cssify() + "'><a href='../../" + doc_id + "/" + attachment_name + "'>" + attachment_name + "</a> <a class='delete_image' rel='" + attachment_name + "'>Delete</a></li>");
          
          }
        });
      }
    });
  });

  $('a.delete_image').live("click", function() { 
    
    var doc_rev = $("input#document_rev_id").val();
    var doc_id = $("input#document_id").val();    
    var attachment_name = $(this).attr('rel');

    $.ajax({
      type: "DELETE",
      url: (couchapp.db.uri + encodeDocId(doc_id) + '/' + attachment_name + "?rev=" + doc_rev),
      success: function(resp) {
        resp = JSON.parse(resp);
        //console.log(resp);
        $('li.' + attachment_name.cssify()).fadeOut('fast');
        $('img.' + attachment_name.cssify()).remove();
        $("input#document_rev_id").val(resp.rev);
      }
    });
  });
  
}); 