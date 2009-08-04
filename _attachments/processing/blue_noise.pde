void setup() {
  size(600,480);
  noStroke();
  background(#8AB2D6);  
  smooth();
  
  int colors = 6;
  color endColor = color(#8AB2D6);
  color startColor = color(#27457C);
  color[] palette = new color[colors];
  for (int j = 0; j < colors; j++) { 
    palette[j] = lerpColor(startColor, endColor, (j* 100 / colors)*0.01);
  }
  
  for (int i = 0; i < palette.length; i = i + 2) { 
    b = new Bouquet(palette[i], palette[i+1], i);
    b.display();
  }

}


class Bouquet {
  
  color c1, c2;
  Flower f;
  
  Bouquet(int ca, int cb, int order) {
    c1 = ca;
    c2 = cb;
  }
  
  void display() {
    
    for (int i = 0; i < random(width/3,width*0.66); i++) {
      f = new Flower(random(width), random(height), c1, c2, order);
      f.display();
    }
  }
}


class Flower {

  int xpos, ypos;
  float radius;
  color c1, c2, clr;
  float increment = 0.035;
  float density;
  

  Flower(int x, int y, color ca, color cb, int order) {
    xpos = x;
    ypos = y;  
    c1 = ca;
    c2 = cb;
    clr = lerpColor(c1, c2, random(100)*0.01);
    density = noise(x*increment, y*increment);
    radius = random(4,35);
  }

  void display() {
    if (density > (0.65 + order*0.01)) {
      pushMatrix();
      translate(xpos, ypos);
      rotate(PI/30 * random(-10,10));
      for (int i = 0; i < 45; i++) {
        rotate(PI/30);
        fill(clr, i);
        ellipse(radius/4.0, radius/4.0, radius, radius);
      }
      popMatrix();
    }
  }

}