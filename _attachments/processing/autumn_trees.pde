Tree tree;

void setup() {
  size(600, 480);
  smooth();
  noStroke();
  background(#EFF4FB); 
  fill(#6E5E26, 100);
  rect(0, height/3*2, width, height);
  //background(255);
  for (int i = 0; i < 10; i++) { 
    tree = new Tree(int(random(0, width)), int(height/2 + random(-20,20)), int(height/3 + random(-40,40)));
    tree.display();
  }
}

class Tree {
  
  int xpos, ypos, radius;
  
  Tree(int x, int y, int r) {
    xpos = x; ypos = y; radius = r;
  }
  
  void drawTrunk() {
    pushMatrix();
    fill(84, 73, 45, 255);
    int trunkx = int(xpos - random(radius/10));
    int thickness = int(random(3,10));
    //translate(xpos, ypos);
    rotate(random(-5,5) * PI/360);
    rect(trunkx, ypos + random(radius/20), thickness, random(radius * 0.75, radius));
    popMatrix();
  }
  
  void drawBody() {
    pushMatrix();
    noStroke();
    color to = color(#A1030F);
    color from = color(#369A0A);
    translate(xpos, ypos);
    rotate(-25 * PI/360);
    fill(lerpColor(to, from, random(100)*0.01), random(150,255));
    ellipse(0, 0, radius, radius*.70);
    popMatrix();
  }
  
  void display() {
    drawTrunk();
    drawBody();
  }
  
  
}