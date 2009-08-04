Bush bush;

void setup() {
  size(600,480);
  background(#8AB2D6);
  noStroke();
  smooth();
  
  drawOcean();
  drawSandBands();
  drawBushes();
  
}


void randomSandColor() {
  color to = color(#8B2F16);
  color from = color(#E9DCB0);
  fill(lerpColor(to, from, random(100)*0.01));
}

void drawOcean() {
  fill(#3A588E);
  beginShape();
  vertex(0,height/3);
  vertex(width, height/3);
  vertex(width, height);
  vertex(0, height);
  endShape(); 
}

void drawSandBands() {
  
  float var_point = width/3 + random(-width/9, width/9);
  
  randomSandColor();
  beginShape();
  vertex(0, height);
  vertex(width, height);
  vertex(width, height/3);
  vertex(var_point, height/3);
  bezierVertex(
    var_point, height/3,
    width, height/3,
    0, height/2
  );
  endShape();
  
  randomSandColor();
  beginShape();
  vertex(0, height);
  vertex(width, height);
  vertex(width, height/3);
  vertex(var_point, height/3);
  bezierVertex(
    var_point, height/3,
    width + width/3, height/3,
    0, height/3*2
  );
  endShape();
  
  
  //C2BEC1
  randomSandColor();
  beginShape();
  vertex(0, height);
  vertex(width, height);
  vertex(width, height/3);
  vertex(var_point, height/3);
  bezierVertex(
    var_point, height/3,
    width + width/7*6, height/3,
    0, height/9*8
  );
  endShape();
  
  randomSandColor();
  beginShape();
  vertex(0, height);
  vertex(width, height);
  vertex(width, height/3);
  vertex(var_point, height/3);
  bezierVertex(
    var_point, height/3,
    width + width*9/7, height/3,
    width/2, height
  );
  endShape();
  
  
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
    radius = int(pow((xpos - width/5*3), 2)*.002) + height/21;
  }
  
  void drawBody() {
    pushMatrix();
    noStroke();
    translate(xpos, ypos);
    rotate(-35 * PI/360);
    fill(#38441D, random(150,255));
    ellipse(0, 0, radius, radius*3/4);
    popMatrix();
  }
  
  void display() {
    drawBody();
  }
  
  
}