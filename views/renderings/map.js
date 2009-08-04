function(doc) {
  if (doc.type == "rendering") {
    emit(doc.created_at, doc);
  }
};