function(doc) {
  if (doc.type == "sketch") {
    emit(doc.name, doc);
  }
};