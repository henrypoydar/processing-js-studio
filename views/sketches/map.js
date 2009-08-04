function(doc) {
  if (doc.type == "sketch") {
    emit(doc.created_at, doc);
  }
};