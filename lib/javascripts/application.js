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

  
}); 