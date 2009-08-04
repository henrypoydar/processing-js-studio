function(doc) {
  if (doc.type == "canvas_rendition"
      && doc.template_algorithm 
      && doc.template_algorithm.name) 
  {
    emit(doc.template_algorithm.name, 1);
  }
}