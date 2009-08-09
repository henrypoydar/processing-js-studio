



$(document).ready(function() {  
  $('#flash').click(function() { $(this).fadeOut('fast'); });
  $('a.toggle_grid').live("click", function() { $('.overlay').toggleClass('grid'); });
  $('a.toggle_palette').live("click", function() { $('ul.palette').toggle(); });
  $('a.toggle_source').live("click", function() { $('.source_code').toggle(); });
  
  $('input.preview').live("click", function() {
    $('canvas.preview').each(function() {
      Processing(this, $('textarea.source').val());
      $(this).show();
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
        $('li.' + attachment_name.cssify()).fadeOut('fast');
        $('img.' + attachment_name.cssify()).remove();
        console.log(resp);
      }
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
           
           $("input#document_rev_id").val(resp['rev']);
           
           form.find("#progress").css("visibility", "hidden");
           var dialog = $('#dialog');
           dialog.fadeOut("fast", function() {
             $("#dialog, #overlay, #overlay-frame").remove();
           });
           
         }
        });
      }
    });
  });

  
}); 