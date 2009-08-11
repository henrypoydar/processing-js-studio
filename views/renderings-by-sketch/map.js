function(doc) {
  if (doc.type == "rendering") {
    emit(doc.sketch.name, doc);
  }
};