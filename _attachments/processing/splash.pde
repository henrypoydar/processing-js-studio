void setup() {
  size(600, 480);
  smooth();
  background(255);
  fill(204, 255, 204, 50);
  noStroke();
  frameRate(16);
  splats = new ArrayList();   
}



void draw() {
  background(255);
  if ((frameCount % 10) == 0) {
    splats.add(new Splat(random(screen_width), random(screen_height), random(10,200)));
  }
  for (int i = splats.size()-1; i >= 0; i--) { 
     Splat splat = (Splat) splats.get(i);
     splat.display();
     if (splat.finished()) { splats.remove(i); }
   }
}

class Splat {
  
  int xpos, ypos, radius, increment;
  float rotation;

  Splat(int x, int y, int r) {
    xpos = x; ypos = y; radius = r;
    increment = 0;
    rotation = random(-10,10) * PI/360;
  }
  
  void update() {
    increment += 1;
    ypos += 1;
  }
  
  void finished() {
    if (increment > 100) {
      return true;
    } else {
      return false;
    }
  }
  
  void display() {
    update();
    rotate(rotation);
    rect(xpos, ypos, radius, radius);
    rotate(-rotation);
  }
  
}

