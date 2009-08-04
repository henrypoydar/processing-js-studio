void setup() {
  size(600,480);
  background(#ffffff);
  noStroke();
  smooth();
  drawSquares(width/5*3, height/2, height/50);
  drawCircles(width/5*3, height/2);  
}

void randomVertex(int x, int y) {
  int varz = height/100;
  vertex((x + random(-varz, varz)), (y + random(-varz, varz)));
}

void drawSquares(int x, int y, int varz) {
  
  pushMatrix();
  translate(x - varz, y - varz);
  fill(#0074EF);
  beginShape();
  randomVertex(0, 0);
  randomVertex(-width/5, 0);
  randomVertex(-width/5, -width/5);
  randomVertex(0, -width/5);
  endShape();
  popMatrix();
  
  pushMatrix();
  translate(x + varz, y - varz);
  noFill();
  stroke(#000000);
  strokeWeight(height/100);
  beginShape();
  vertex(0, 0);
  randomVertex(width/5, 0);
  randomVertex(width/5, -width/5);
  randomVertex(0, -width/5);
  vertex(0, 0);
  endShape();
  popMatrix();
  
  pushMatrix();
  translate(x + varz, y + varz);
  fill(#005B54);
  noStroke();
  beginShape();
  randomVertex(0, 0);
  randomVertex(width/5, 0);
  randomVertex(width/5, width/5);
  randomVertex(0, width/5);
  endShape();
  popMatrix();
  
  pushMatrix();
  translate(x - varz, y + varz);
  fill(#F04923);
  noStroke();
  beginShape();
  randomVertex(0, 0);
  randomVertex(-width/5, 0);
  randomVertex(-width/5, width/5);
  randomVertex(0, width/5);
  endShape();
  popMatrix();
  
}

void drawCircles(int x, int y) {
  
  pushMatrix();
  translate(x, y);
  fill(#8E0000);
  stroke(#ffffff);
  strokeWeight(height/100);
  ellipse(width/7, -height/11, width/5, width/5);
  popMatrix();
  
  pushMatrix();
  translate(x, y);
  fill(#468D50);
  noStroke();
  ellipse(-width/7, -height/7, width/7, width/7);
  popMatrix();
  
  pushMatrix();
  translate(x, y);
  fill(#E7AD00);
  stroke(#ffffff);
  strokeWeight(height/200);
  ellipse(-width/6, height/7, width/9, width/9);
  popMatrix();
  
}