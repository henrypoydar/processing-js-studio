void setup() {

  int granularity = 8;
   
  int canvas_w = 600;
  int canvas_h = 480;
  
  size(canvas_w, canvas_h);  
  background(#FDF1CB);  
  noStroke();
  smooth();
  
  color[] palette = {
//    color(#94E5F4), color(#102657),
//    color(#51A8D5), color(#122C66),
//    color(#003ED3), color(#41D1FF),
//    color(#2B3448), color(#990000)
//    color(#456EB0), color(#C4D88F),
//    color(#45B04D), color(#980200)
    color(#C2E5AF), color(#930C08),
    color(#EBC732), color(#50210F),
    color(#52753F), color(#8DB9AA),
    color(#34627C), color(#83A9BE),
    
    
  };

  drawRects(palette, canvas_w, canvas_h, granularity, 0, (canvas_h/3 * 2));
  drawRects(palette, canvas_w, canvas_h, granularity, (canvas_h/3 * 2), (canvas_h/3));

}  

void drawRects(color[] p, int w, int h, int g, int y, int rh) {
  int i = 0;
  int eo = 0;
  while(i < (w / g)) {
    int rw = g * int(random(1,4));
    fill(color(p[int(random(p.length))]));
    if(eo == 0) {
      //rect(i*g, y, rect_w, rh);
      wavyRect(color(p[int(random(p.length))]), i*g, y, rw, rh); 
      eo = 1;
    } else {
      eo = 0;
    } 
    i = i + rw/g; 
  }
}

void wavyRect(color c, int x, int y, int w, int h) {
  float cf = 0.25;
  fill(c);
  beginShape();
  //rect(x, y, w, h);
  vertex(x + random(-w*cf, w*cf), y);
  curveVertex(x + random(-w*cf, w*cf), y + (h/2 + random(-h/3, h/3)));
  vertex(x + random(-w*cf, w*cf), y + h);
  vertex(x + w + random(-w*cf, w*cf), y + h);
  curveVertex(x + w + random(-w*cf, w*cf), y + (h/2 + random(-h/3, h/3)));
  vertex(x + w + random(-w*cf, w*cf), y);
  endShape(CLOSE);
}