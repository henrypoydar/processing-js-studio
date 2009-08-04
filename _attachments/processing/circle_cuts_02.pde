int screen_width = 600;
int screen_height = 480;

int thirds_x = screen_width / 3;
int thirds_y = screen_height / 3;

void setup() {
  
  size(screen_width, screen_height);
  smooth();
  ellipseMode(RADIUS);
  
  oc1 = new OuterCircle(0,255,0);
  oc2 = new OuterCircle(0,0,0);
  oc3 = new OuterCircle(255,255,255);
  
  ic1 = new InnerCircle();
  ic2 = new InnerCircle();
  
  spot = new Spot();

}

void draw() {
  
  background(255);
  
  oc1.update();
  oc2.update();
  oc3.update();
  
  ic1.update();
  ic2.update();
  
  spot.update();
  
  oc1.display();
  oc2.display();
  oc3.display();
  
  ic1.display();
  ic2.display();

  spot.display();
  
}


class CircleCut {
  
  int xpos, ypos;
  float radius, line_width;
  int fill_r, fill_g, fill_b;
  int target_x, target_y;
  int orig_x, orig_y;
  float easing = 0.01;
  
  CircleCut(int x, int y, float r, float lw, int fr, int fg, int fb) {
    xpos = x; ypos = y; radius = r;
    line_width = lw; fill_color = c;
    fill_r = fr; fill_b = fg; fill_b = fb;
  }
  
  void update() {
    
    float dx = target_x - xpos;
    if(abs(dx) > 1) {
      xpos += dx * easing;
    } else {
      resetEasingTargets();
    }

    float dy = target_y - ypos;
    if(abs(dy) > 1) {
      ypos += dy * easing;
    } else {
      resetEasingTargets();
    }
  
  }
  
  void display() {
    fill(fill_r, fill_g, fill_b);
    strokeWeight(line_width); 
    stroke(0);
    ellipse(xpos, ypos, radius, radius);
  }
  
  void resetEasingTargets() {
    target_x = xpos + random(-30,30);
    target_y = ypos + random(-30,30);
    if((abs(target_x - xpos) > 30) || (abs(target_y - ypos) > 30)) {
      resetEasingTargets();
    }
  }
}

class OuterCircle extends CircleCut {
  
  OuterCircle(int fr, int fg, int fb) {
    xpos = thirds_x * 2 + random(-20,20);
    ypos = thirds_y * 2  + random(-20,20);
    fill_r = fr; fill_g = fg, fill_b = fb;
    radius = screen_width / 2.25 + random(-20,20);
    line_width = random(50) * 0.1;
    orig_x = xpos;
    orig_y = ypos;
    resetEasingTargets();
  }
  
  void display() {
    fill(fill_r, fill_g, fill_b);
    noStroke();
    ellipse(xpos, ypos, radius, radius);
  }
  
}

class InnerCircle extends CircleCut {
  
  InnerCircle() {
    xpos = thirds_x * 2 + random(-40,40);
    ypos = thirds_y * 2  + random(-40,40);
    radius = screen_width / 4 + random(-5,5);
    line_width = random(60) * 0.1;
    orig_x = xpos;
    orig_y = ypos;
    resetEasingTargets();
  }
  
  void display() {
    noFill();
    strokeWeight(line_width); 
    stroke(0);
    ellipse(xpos, ypos, radius, radius);
  }

}

class Spot extends CircleCut {
  
  Spot() {
    xpos = thirds_x * 2 + random(-40,40);
    ypos = thirds_y * 2  + random(-40,40);
    radius = screen_width / 6 + random(-5,5);
    orig_x = xpos;
    orig_y = ypos;
    resetEasingTargets();
  }
  
  void display() {
    fill(0);
    strokeWeight(10); 
    stroke(255);
    ellipse(xpos, ypos, radius, radius);
  }

}