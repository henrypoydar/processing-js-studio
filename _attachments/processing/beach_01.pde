Bush bush;

void setup() {
  size(600,480);
  background(#92ACD9);
  noStroke();
  smooth();

  drawBaseSand();
  drawOcean();
  drawSandBands();
  drawBushes();
  //drawHut(width/9*5, (height/3 - height/51), height/11);

}

void drawHut(float x, float y, float w) {
  fill(#e7e7e7);
  //strokeWeight(height/100);
  //stroke(#ffffff);
  beginShape();
  vertex(x, y + w/2);
  vertex(x, y - w/2);
  vertex(x + w, y - w/2);
  vertex(x + w, y + w/2);
  endShape(); 
  fill(#2A7CB7);
  
}

void drawBushes() {
 
  for (int i = 0; i < 10; i++) { 
    bush = new Bush(int(random(width/5*3, width)), height/3);
    bush.display();
  }
}

class Bush {
  
  int xpos, ypos, radius;
  
  Bush(int x, int y) {
    xpos = x; ypos = y; 
    radius = int(pow((xpos - width/5*3), 2)*.002) + height/21; //+ int(random(-height/100, height/100));
    
    //radius = 10;
    //ypos = ypos - radius/3; 
  }
  
  void drawBody() {
    pushMatrix();
    noStroke();
    color to = color(#25481F);
    color from = color(#1C301A);
    translate(xpos, ypos);
    rotate(-35 * PI/360);
    fill(lerpColor(to, from, random(100)*0.01), random(150,255));
    ellipse(0, 0, radius, radius*3/4);
    popMatrix();
  }
  
  void display() {
    drawBody();
  }
  
  
}


void drawBaseSand() {
  fill(#5C5652);
  rect(0, height/3, width, height); 
}

void drawOcean() {
  fill(#223959);
  beginShape();
  vertex(0, height/3);
  vertex(width/2, height/3);
  bezierVertex(
    width/2, height/3,
    width/2 + width/7, height/3,
    0, height/3 + height/7
  );
  endShape();  
}


void drawSandBands() {

  float var_point = width/5*3 + random(-width/9, width/9);
  
  // A pre-band of sand
  fill(#746D68);
  beginShape();
  vertex(var_point, height);
  vertex(width, height);
  vertex(width, height/3);
  vertex(var_point, height/3);
  bezierVertex(
    var_point, height/3,
    -width/3, height/3 + height/7,
    var_point, height
  );
  endShape();
  
  // A band of sand
  fill(#A28F87);
  beginShape();
  vertex(width, height/5*4);
  vertex(width, height/3);
  vertex(var_point, height/3);
  bezierVertex(
    var_point, height/3,
    -width/5, height/3 + height/7,
    width, height/5*4
  );
  endShape();
  
  fill(#C5C0C0);
  beginShape();
  vertex(width, height/7*4);
  vertex(width, height/3);
  vertex(var_point, height/3);
  bezierVertex(
    var_point, height/3,
    0, height/3 + height/7,
    width, height/7*4
  );
  endShape();
 
}
